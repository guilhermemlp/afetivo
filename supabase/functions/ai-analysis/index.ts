// Afetivo — Edge Function de análise com IA (Fase 6, pré-programada).
//
// Nada aqui é obrigatório para o app funcionar: sem as envs abaixo a função
// responde 501 `not_configured` e o cliente cai para a análise local.
//
// Env do servidor (nunca no bundle do cliente):
//   AI_ENDPOINT  URL no formato "chat completions" (OpenAI-compatible).
//                Ex.: Gemini com endpoint compatível, OpenAI, OpenRouter, Groq…
//   AI_API_KEY   chave do provedor (só neste ambiente)
//   AI_MODEL     id do modelo (ex.: "gemini-2.0-flash")
//   AI_PROVIDER  rótulo exibido na tela (ex.: "Gemini", "OpenRouter")
//
// Payload aceito (só agregados — sem notas nem textos do usuário):
//   { periodDays, periodLabel, stats: {...}, tags: [{label, count}] }
// Resposta esperada pelo cliente:
//   { providerLabel, text }

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = [
  'Você redige uma leitura descritiva de um diário pessoal de humor, em português do Brasil.',
  'Responda em 4 a 6 linhas curtas ou marcadores (bullets).',
  'Regras obrigatórias:',
  '- Use somente os dados agregados fornecidos; não invente eventos nem valores.',
  '- Valores nulos significam ausência de dados: nunca trate como zero nem preencha lacunas.',
  '- Não faça diagnóstico, prognóstico, sugestão de dose, troca ou suspensão de medicação.',
  '- Não afirme causalidade: correlação não implica causa.',
  '- Não recomende tratamentos; descreva apenas o que os registros mostram.',
  '- Termine com a linha: Registro descritivo — não substitui orientação profissional.',
].join('\n');

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

function isFiniteOrNull(value: unknown): boolean {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}
function isValidPayload(raw: unknown): raw is {
  periodDays: number | null;
  periodLabel: string;
  stats: Record<string, unknown>;
  tags: { label: string; count: number }[];
} {
  if (raw === null || typeof raw !== 'object') return false;
  const body = raw as Record<string, unknown>;
  if (body.periodDays !== null && typeof body.periodDays !== 'number') return false;
  if (typeof body.periodLabel !== 'string' || body.periodLabel.length > 80) return false;
  if (body.stats === null || typeof body.stats !== 'object') return false;
  if (!Array.isArray(body.tags) || body.tags.length > 20) return false;
  return body.tags.every(
    (tag) =>
      tag !== null &&
      typeof tag === 'object' &&
      typeof (tag as Record<string, unknown>).label === 'string' &&
      typeof (tag as Record<string, unknown>).count === 'number',
  );
}

function userPrompt(body: {
  periodLabel: string;
  stats: Record<string, unknown>;
  tags: { label: string; count: number }[];
}): string {
  const fields = [
    'periodLabel',
    'entryCount',
    'daysWithEntries',
    'daysInRange',
    'responseCount',
    'avgMood',
    'avgActivation',
    'avgSleepHours',
    'intakeCount',
    'impulseCount',
  ]
    .map((key) => `${key}: ${JSON.stringify(body.stats[key] ?? null)}`)
    .join('\n');
  const tags = body.tags.map((tag) => `${tag.label} (${tag.count})`).join(', ') || 'nenhuma';
  return `Dados agregados do período (null = sem dados):\n${fields}\nTags mais frequentes: ${tags}`;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (request.method !== 'POST') {
    return json(405, { code: 'method_not_allowed' });
  }

  try {
    const endpoint = Deno.env.get('AI_ENDPOINT');
    const apiKey = Deno.env.get('AI_API_KEY');
    const model = Deno.env.get('AI_MODEL');
    if (!endpoint || !apiKey || !model) {
      return json(501, { code: 'not_configured', message: 'IA não configurada no servidor.' });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return json(400, { code: 'invalid_request', message: 'JSON inválido.' });
    }
    if (!isValidPayload(payload)) {
      return json(400, { code: 'invalid_request', message: 'Payload fora do contrato.' });
    }
    if (!Object.values(payload.stats).every(isFiniteOrNull)) {
      return json(400, { code: 'invalid_request', message: 'Payload fora do contrato.' });
    }

    const providerLabel = Deno.env.get('AI_PROVIDER') ?? 'IA remota';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 500,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt(payload) },
          ],
        }),
        signal: controller.signal,
      });
      if (!upstream.ok) {
        return json(502, {
          code: 'provider_error',
          message: `Provedor respondeu ${upstream.status}.`,
        });
      }
      const data = (await upstream.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const text = data.choices?.[0]?.message?.content;
      if (typeof text !== 'string' || text.trim() === '') {
        return json(502, { code: 'invalid_response', message: 'Resposta vazia do provedor.' });
      }
      return json(200, { providerLabel, text: text.trim() });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return json(500, { code: 'internal', message: 'Erro interno.' });
  }
});
