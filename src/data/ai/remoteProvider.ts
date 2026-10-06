import { AiAnalysisError, type AiAnalysisProvider, type AiAnalysisRequest } from './types';

const REQUEST_TIMEOUT_MS = 20_000;

interface RemoteResponse {
  providerLabel: string;
  text: string;
}

function parseResponse(raw: unknown): RemoteResponse {
  if (raw === null || typeof raw !== 'object') {
    throw new AiAnalysisError('invalid_response', 'Resposta sem objeto JSON.');
  }
  const body = raw as Record<string, unknown>;
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (text === '') {
    throw new AiAnalysisError('invalid_response', 'Resposta sem texto de análise.');
  }
  const providerLabel =
    typeof body.providerLabel === 'string' && body.providerLabel.trim() !== ''
      ? body.providerLabel.trim()
      : 'IA remota';
  return { providerLabel, text };
}

/**
 * Provedor remoto: chama a Edge Function configurada em
 * `VITE_AI_ANALYSIS_URL`. A chave real da IA nunca aparece aqui — fica no
 * servidor; falhas de rede/formato viram `AiAnalysisError` para o chamador
 * decidir o fallback local.
 */
export function createRemoteAiProvider(endpoint: string): AiAnalysisProvider {
  return {
    id: 'remote',
    label: 'IA remota',
    async analyze(request: AiAnalysisRequest) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        if (!response.ok) {
          if (response.status === 501) {
            throw new AiAnalysisError(
              'not_configured',
              `IA não configurada (HTTP ${response.status}).`,
            );
          }
          throw new AiAnalysisError(
            'network',
            `Falha no servidor de análise (HTTP ${response.status}).`,
          );
        }
        const parsed = parseResponse(await response.json());
        return {
          providerId: 'remote',
          providerLabel: parsed.providerLabel,
          text: parsed.text,
          generatedAt: Date.now(),
        };
      } catch (error) {
        if (error instanceof AiAnalysisError) throw error;
        throw new AiAnalysisError('network', 'Não foi possível falar com o servidor de análise.');
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
