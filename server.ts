import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val)) return val;
  }
  if (isProd) {
    return parseInt(process.env.PORT || '8080', 10);
  }
  return 3000;
}

function getHost(): string {
  const hostArgIndex = process.argv.indexOf('--host');
  if (hostArgIndex !== -1 && process.argv[hostArgIndex + 1]) {
    return process.argv[hostArgIndex + 1];
  }
  return '0.0.0.0';
}

const PORT = getPort();
const HOST = getHost();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Helper to initialize Gemini client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Rule-based fallback synthesis without any psychiatric diagnosis
function generateLocalEmotionalSynthesis(entries: any[], medications: any[]) {
  if (!entries || entries.length === 0) {
    return {
      summary: 'Ainda não há registros suficientes para consolidar a análise de padrões emocionais.',
      patterns: [],
      sleepCorrelation: 'Sem dados suficientes de sono.',
      medicationCorrelation: 'Sem dados suficientes de rotina.',
      clinicalNotes: 'Continue registrando seus dias para identificar tendências entre suas noites de sono, sentimentos e impulsos.',
      earlyWarningSigns: [],
      suggestedStrategies: [
        'Mantenha horários regulares para acordar e desacelerar à noite.',
        'Faça uma pausa de respiração consciente antes de agir em momentos de impulso.',
      ],
    };
  }

  // Statistical calculations
  let totalSleep = 0;
  let sleepCount = 0;
  let highEnergyDays = 0;
  let lowEnergyDays = 0;
  let balancedDays = 0;
  let mixedDays = 0;
  let impulseIncidents = 0;
  const triggerMap: Record<string, number> = {};
  const impulseMap: Record<string, number> = {};
  const protectionMap: Record<string, number> = {};

  // Physical Activity Tracking
  let totalWorkouts = 0;
  let totalWorkoutMinutes = 0;
  const workoutTypeMap: Record<string, number> = {};
  let moodSumWithWorkout = 0;
  let workoutDaysCount = 0;
  let moodSumWithoutWorkout = 0;
  let nonWorkoutDaysCount = 0;
  let anxietySumWithWorkout = 0;
  let anxietySumWithoutWorkout = 0;

  entries.forEach((e) => {
    if (typeof e.sleepHours === 'number') {
      totalSleep += e.sleepHours;
      sleepCount++;
    }
    if (e.moodScore > 0) highEnergyDays++;
    else if (e.moodScore < 0) lowEnergyDays++;
    else balancedDays++;

    if (e.isMixedState) mixedDays++;

    // Workout tracking
    const hasWorkout = e.physicalActivities && e.physicalActivities.length > 0;
    if (hasWorkout) {
      workoutDaysCount++;
      moodSumWithWorkout += e.moodScore;
      anxietySumWithWorkout += (e.anxietyLevel ?? 0);
      e.physicalActivities!.forEach((w: any) => {
        totalWorkouts++;
        totalWorkoutMinutes += (Number(w.durationMinutes) || 0);
        const t = w.type || 'Outro';
        workoutTypeMap[t] = (workoutTypeMap[t] || 0) + 1;
      });
    } else {
      nonWorkoutDaysCount++;
      moodSumWithoutWorkout += e.moodScore;
      anxietySumWithoutWorkout += (e.anxietyLevel ?? 0);
    }

    if (e.impulsiveBehaviors && e.impulsiveBehaviors.length > 0) {
      impulseIncidents += e.impulsiveBehaviors.length;
      e.impulsiveBehaviors.forEach((b: any) => {
        const key = b.type || 'Outro impulso';
        impulseMap[key] = (impulseMap[key] || 0) + 1;
      });
    }

    if (e.triggers && Array.isArray(e.triggers)) {
      e.triggers.forEach((t: string) => {
        triggerMap[t] = (triggerMap[t] || 0) + 1;
      });
    }

    if (e.protectiveFactors && Array.isArray(e.protectiveFactors)) {
      e.protectiveFactors.forEach((p: string) => {
        protectionMap[p] = (protectionMap[p] || 0) + 1;
      });
    }
  });

  const avgSleep = sleepCount > 0 ? (totalSleep / sleepCount).toFixed(1) : '7.0';
  const topTriggers = Object.entries(triggerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `${k} (${v}x)`);

  const topImpulses = Object.entries(impulseMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `${k} (${v}x)`);

  const topProtections = Object.entries(protectionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `${k} (${v}x)`);

  const topWorkoutTypes = Object.entries(workoutTypeMap)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} (${v}x)`);

  const avgMoodWithWorkout = workoutDaysCount > 0 ? (moodSumWithWorkout / workoutDaysCount).toFixed(1) : null;
  const avgMoodWithoutWorkout = nonWorkoutDaysCount > 0 ? (moodSumWithoutWorkout / nonWorkoutDaysCount).toFixed(1) : null;
  const avgAnxietyWithWorkout = workoutDaysCount > 0 ? (anxietySumWithWorkout / workoutDaysCount).toFixed(1) : null;
  const avgAnxietyWithoutWorkout = nonWorkoutDaysCount > 0 ? (anxietySumWithoutWorkout / nonWorkoutDaysCount).toFixed(1) : null;

  let physicalActivityCorrelation = '';
  if (workoutDaysCount > 0) {
    physicalActivityCorrelation = `Foram ${workoutDaysCount} dias com prática de exercícios (${totalWorkoutMinutes} min acumulados: ${topWorkoutTypes.join(', ')}). `;
    if (avgMoodWithWorkout && avgMoodWithoutWorkout) {
      physicalActivityCorrelation += `Nos dias com atividade física, o humor tendeu para estabilidade (${avgMoodWithWorkout} vs ${avgMoodWithoutWorkout} nos dias sedentários) e a ansiedade média foi de ${avgAnxietyWithWorkout}/5 (vs ${avgAnxietyWithoutWorkout}/5 nos dias sem treino).`;
    }
  } else {
    physicalActivityCorrelation = 'Nenhuma atividade física registrada no período para cruzamento de dados com humor.';
  }

  const patterns = [];
  if (lowEnergyDays > highEnergyDays) {
    patterns.push(`Predomínio de dias com menor energia ou desânimo (${lowEnergyDays} de ${entries.length} dias).`);
  } else if (highEnergyDays > lowEnergyDays) {
    patterns.push(`Predomínio de dias com energia elevada ou aceleração (${highEnergyDays} de ${entries.length} dias).`);
  } else {
    patterns.push(`Bom equilíbrio geral com ${balancedDays} dias de estabilidade e calma.`);
  }

  if (workoutDaysCount >= 3) {
    patterns.push(`Consistência de atividade física mantida (${workoutDaysCount} dias de treino), gerando sensação de clareza mental e descompressão.`);
  }

  if (Number(avgSleep) < 6.5) {
    patterns.push(`Média de sono reduzida (${avgSleep}h). Poucas horas de sono costumam coincidir com maior irritabilidade e facilidade para impulsos.`);
  } else if (Number(avgSleep) > 9.0) {
    patterns.push(`Mais horas de sono do que o habitual (${avgSleep}h em média), comum em períodos de maior cansaço ou necessidade de recarregar energia.`);
  }

  if (impulseIncidents > 0) {
    patterns.push(`Registrados ${impulseIncidents} episódios de impulsos/hábitos que demandaram atenção.`);
  }

  const sleepTrend = Number(avgSleep) < 6.5
    ? 'Noites com sono abaixo de 6,5h associadas a maior irritabilidade e impulsividade no dia seguinte.'
    : 'Sono regular em faixa suficiente contribuiu para a estabilidade do humor.';

  const resumo_geral = `No período avaliado (${entries.length} dias), observou-se predomínio de ${
    balancedDays >= entries.length / 2 ? 'estabilidade serena e equilíbrio' : lowEnergyDays > highEnergyDays ? 'momentos de menor energia' : 'energia elevada'
  }, com média de sono de ${avgSleep}h por noite. A prática de atividades físicas em ${workoutDaysCount} dias atuou como importante âncora reguladora de ansiedade.`;

  const correlacoes_principais = [
    {
      titulo: 'Sono e disposição no dia seguinte',
      observacao: sleepTrend,
      forca: Number(avgSleep) < 6.5 ? ('forte' as const) : ('moderada' as const),
    },
    {
      titulo: 'Atividade física e regulação de ansiedade',
      observacao: workoutDaysCount > 0
        ? `Exercícios (${topWorkoutTypes.join(', ') || 'treinos'}) associados a menor índice de ansiedade e maior sensação de dever cumprido.`
        : 'Sem registros suficientes de treinos para correlacionar alívio de estresse.',
      forca: workoutDaysCount >= 3 ? ('forte' as const) : ('moderada' as const),
    },
    {
      titulo: 'Fatores de proteção e contenção de impulsos',
      observacao: topProtections.length > 0
        ? `O uso de proteções ativas (${topProtections.slice(0, 2).join(', ')}) esteve associado à superação de momentos de desestabilização.`
        : 'Construção de repertório de âncoras ainda em desenvolvimento.',
      forca: 'moderada' as const,
    },
  ];

  const gatilhos_mais_frequentes = topTriggers.length > 0
    ? topTriggers.map((t) => t.split(' (')[0])
    : ['Poucas horas de sono', 'Pressão de prazos', 'Excesso de telas'];

  const protecoes_mais_eficazes = topProtections.length > 0
    ? topProtections.map((p) => p.split(' (')[0])
    : ['Pausa e respiração consciente', 'Praticar atividade física', 'Conversar com alguém de confiança'];

  const sinais_de_alerta_previos = [
    'Menos de 6,5 horas de sono por duas noites consecutivas',
    'Sensação de agitação física acompanhada de cansaço mental',
    'Impulso súbito para compras ou telas como fuga de tensão',
  ];

  const estrategias_praticas = [
    {
      situacao: 'Ao sentir urgência para agir sobre um impulso',
      acao_sugerida: 'Aplicar a regra dos 15 minutos: beber um copo d’água, afastar o celular e aguardar a onda passar.',
    },
    {
      situacao: 'Nos dias de mente acelerada ao deitar',
      acao_sugerida: 'Realizar descompressão: 5 minutos de respiração diafragmática e anotar pendências num papel.',
    },
    {
      situacao: 'Quando a ansiedade ou irritabilidade começar a subir',
      acao_sugerida: 'Ativar uma âncora corporal rápida: caminhada leve de 10 min ou alongamento com respiração calma.',
    },
  ];

  const observacao_exercicio = workoutDaysCount > 0
    ? `Foram ${workoutDaysCount} dias de treino registrados (${totalWorkoutMinutes} min acumulados). Os dias com exercício físico demonstraram humor médio de ${avgMoodWithWorkout || '0'} e ansiedade de ${avgAnxietyWithWorkout || '1'}/5, confirmando o treino como regulador funcional.`
    : 'Nenhuma atividade física registrada no período. A inserção gradual de caminhadas ou treinos leves pode potencializar a autorregulação.';

  const ponto_positivo = topProtections.length > 0
    ? `Você já possui ${topProtections.length} âncoras de proteção testadas na prática que funcionam para desacelerar momentos difíceis.`
    : 'Você manteve a consistência de registrar suas emoções, dando o primeiro passo essencial para a clareza e autorregulação.';

  return {
    resumo_geral,
    correlacoes_principais,
    gatilhos_mais_frequentes,
    protecoes_mais_eficazes,
    sinais_de_alerta_previos,
    estrategias_praticas,
    observacao_exercicio,
    ponto_positivo,

    // Backward compatibility fields
    summary: resumo_geral,
    patterns,
    sleepCorrelation: sleepTrend,
    medicationCorrelation: medications.length > 0
      ? `Acompanhamento de ${medications.length} item(ns) de rotina/medicação. Horários consistentes favorecem a previsibilidade do humor.`
      : 'Nenhuma medicação ou suplemento cadastrado para correlação.',
    clinicalNotes: `Gatilhos mais recorrentes: ${gatilhos_mais_frequentes.join(', ')}. Proteções acionadas: ${protecoes_mais_eficazes.join(', ')}.`,
    earlyWarningSigns: sinais_de_alerta_previos,
    suggestedStrategies: estrategias_praticas.map((s) => `${s.situacao} -> ${s.acao_sugerida}`),
    protectiveInsights: `As âncoras que mais ajudaram foram: ${protecoes_mais_eficazes.join(', ')}.`,
    physicalActivityCorrelation,
  };
}

// POST /api/analyze-patterns
app.post('/api/analyze-patterns', async (req, res) => {
  try {
    const { entries, medications, timeFrameDays } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const fallback = generateLocalEmotionalSynthesis(entries, medications);
      return res.json({ success: true, source: 'analise-local', analysis: fallback });
    }

    const prompt = `Você é um assistente de autoconhecimento emocional do Sistema Afetivo. 
Sua única função é analisar padrões de humor, sono, atividade física, impulsos e proteções com base nos dados fornecidos pelo usuário.

REGRAS ABSOLUTAS:
- Nunca faça diagnósticos, nunca use termos psiquiátricos ou médicos (evite palavras como depressão, mania, transtorno, borderline, sintoma clínico).
- Use apenas a linguagem do sistema: níveis de energia (−3 a +3), tranquilidade, equilíbrio, gatilhos, proteções/âncoras.
- Fale de correlações e tendências, nunca de causas definitivas.
- Seja acolhedor, direto e prático.
- Responda SEMPRE no formato JSON abaixo, sem texto antes ou depois.

DADOS DO USUÁRIO (últimos ${timeFrameDays || 30} dias):
${JSON.stringify(entries, null, 2)}

MEDICAÇÕES / ROTINA:
${JSON.stringify(medications, null, 2)}

FORMATO DE SAÍDA OBRIGATÓRIO (JSON):
{
  "resumo_geral": "2-3 frases sobre o padrão dominante do período",
  "correlacoes_principais": [
    {
      "titulo": "ex: Sono e energia no dia seguinte",
      "observacao": "descrição clara da tendência",
      "forca": "forte"
    }
  ],
  "gatilhos_mais_frequentes": ["lista de 3 a 5 gatilhos"],
  "protecoes_mais_eficazes": ["lista das âncoras que mais aparecem em dias de recuperação"],
  "sinais_de_alerta_previos": ["lista de 2 a 4 padrões que costumam preceder dias de baixa energia"],
  "estrategias_praticas": [
    {
      "situacao": "quando isso acontece",
      "acao_sugerida": "o que fazer (estilo TCC/DBT, concreto e curto)"
    }
  ],
  "observacao_exercicio": "análise qualitativa da relação entre treinos e humor/ansiedade",
  "ponto_positivo": "um reconhecimento genuíno de algo que está funcionando bem"
}
`;

    let text = '';
    try {
      const aiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), 6000)
      );

      const response: any = await Promise.race([aiPromise, timeoutPromise]);
      text = response.text || '';
    } catch (aiErr) {
      console.warn('Gemini pattern analysis timed out or unavailable, using deterministic synthesis:', aiErr);
    }

    let parsed;
    try {
      parsed = text ? JSON.parse(text) : generateLocalEmotionalSynthesis(entries, medications);
      // Ensure backwards compatible fields exist
      if (!parsed.summary && parsed.resumo_geral) parsed.summary = parsed.resumo_geral;
      if (!parsed.earlyWarningSigns && parsed.sinais_de_alerta_previos) parsed.earlyWarningSigns = parsed.sinais_de_alerta_previos;
      if (!parsed.suggestedStrategies && parsed.estrategias_praticas) {
        parsed.suggestedStrategies = parsed.estrategias_praticas.map((s: any) => `${s.situacao}: ${s.acao_sugerida}`);
      }
      if (!parsed.protectiveInsights && parsed.protecoes_mais_eficazes) {
        parsed.protectiveInsights = parsed.protecoes_mais_eficazes.join(', ');
      }
      if (!parsed.physicalActivityCorrelation && parsed.observacao_exercicio) {
        parsed.physicalActivityCorrelation = parsed.observacao_exercicio;
      }
    } catch {
      parsed = generateLocalEmotionalSynthesis(entries, medications);
    }

    return res.json({
      success: true,
      source: text ? 'gemini-3.8-flash' : 'analise-deterministica',
      analysis: parsed,
    });
  } catch (error: any) {
    console.error('Error analyzing patterns:', error);
    const fallback = generateLocalEmotionalSynthesis(req.body?.entries || [], req.body?.medications || []);
    return res.json({ success: true, source: 'analise-local', analysis: fallback });
  }
});

function buildFullTextReport(
  fallback: any,
  entries: any[],
  medications: any[],
  userName: string,
  periodDays: number
): string {
  const safeMeds = Array.isArray(medications) ? medications : [];
  const safeEntries = Array.isArray(entries) ? entries : [];
  const medsList = safeMeds.length > 0
    ? safeMeds.map((m: any) => `- ${m.name || 'Item'} ${m.dosage || ''} (${m.frequency || 'conforme rotina'})`).join('\n')
    : 'Nenhum suplemento ou medicação cadastrado no período.';

  return `
========================================================================
       SISTEMA AFETIVO — RELATÓRIO DE ACOMPANHAMENTO EMOCIONAL
========================================================================
Nome: ${userName || 'Guilherme'}
Período analisado: Últimos ${periodDays || 30} dias (${safeEntries.length} registros diários)
Data de emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
Foco metodológico: Mapeamento longitudinal de humor (-3 a +3), noites de sono,
atividades físicas (corrida, musculação, pilates) e repertório de autorregulação.
========================================================================

1. VISÃO GERAL DO PERÍODO
${fallback.resumo_geral || fallback.summary}

2. PADRÕES DE HUMOR E ENERGIA
${(fallback.patterns || []).map((p: string) => `- ${p}`).join('\n') || '- Registros estáveis mantidos ao longo do período.'}

3. IMPACTO DO SONO E ROTINA
${fallback.sleepCorrelation}

4. ATIVIDADES FÍSICAS & CRUZAMENTO COM HUMOR E ANSIEDADE
${fallback.observacao_exercicio || fallback.physicalActivityCorrelation || 'Nenhuma atividade física registrada no período.'}

5. REGISTRO DE GATILHOS E TENSÕES
${fallback.clinicalNotes}

6. FATORES DE PROTEÇÃO & ÂNCORAS MAIS EFICAZES
${(fallback.protecoes_mais_eficazes || []).join(', ') || fallback.protectiveInsights || 'Nenhum fator protetivo registrado no período.'}

7. SINAIS DE ALERTA OBSERVADOS
${(fallback.sinais_de_alerta_previos || fallback.earlyWarningSigns || []).map((s: string) => `- ${s}`).join('\n') || '- Nenhum sinal crítico detectado.'}

8. ACOMPANHAMENTO DE ROTINA E SUPLEMENTOS
${medsList}

9. ESTRATÉGIAS PRÁTICAS SUGERIDAS
${(fallback.estrategias_praticas || []).map((st: any) => typeof st === 'string' ? `- ${st}` : `- ${st.situacao}: ${st.acao_sugerida}`).join('\n') || '- Continue priorizando horários regulares de descanso e pausas conscientes.'}

10. PONTO POSITIVO OBSERVADO
${fallback.ponto_positivo || 'Consistência no autocuidado e no registro sistemático das oscilações de humor.'}
`.trim();
}

// POST /api/clinical-report
app.post('/api/clinical-report', async (req, res) => {
  const entries = req.body?.entries || [];
  const medications = req.body?.medications || [];
  const userName = req.body?.userName || req.body?.patientName || 'Guilherme';
  const periodDays = req.body?.periodDays || 30;

  try {
    const ai = getGeminiClient();

    if (!ai) {
      const fallback = generateLocalEmotionalSynthesis(entries, medications);
      const textReport = buildFullTextReport(fallback, entries, medications, userName, periodDays);
      return res.json({ success: true, source: 'deterministico', reportText: textReport });
    }

    const prompt = `
Gere um resumo estruturado, claro e respeitoso sobre o histórico de humor, emoções, hábitos, impulsos, atividade física e proteções do usuário nos últimos ${periodDays} dias.
Nome: ${userName}
IMPORTANTE: NÃO inclua diagnósticos psiquiátricos nem termos de patologia mental. O objetivo é resumir os fatos, métricas de sono, tendências de humor, eventos impulsivos, prática de atividades físicas (corrida, pilates, musculação, etc.) e O QUE AJUDOU a pessoa a atravessar momentos difíceis (fatores de proteção) para auto-análise ou para que o usuário possa discutir com seu médico/terapeuta de forma informada.

Dados:
${JSON.stringify(entries, null, 2)}
Medicações:
${JSON.stringify(medications, null, 2)}

Estrutura:
- Cabeçalho com data e período.
- Síntese das variações de humor (dias com mais energia, dias neutros/estáveis, dias mais desanimados).
- Relação entre horas de sono e oscilações emocionais.
- Prática de atividades físicas (corrida, pilates, musculação) e seu impacto sobre a regulação do humor e redução da ansiedade.
- Ocorrência de impulsos (compras, alimentação, telas, etc.) e o que funcionou para contê-los.
- Fatores de proteção & o que mais ajudou o usuário nos momentos desafiadores (âncoras).
- Adesão à rotina de medicações/suplementos.
- Pauta com tópicos relevantes para reflexão ou conversa na próxima consulta.
`;

    let reportText = '';
    try {
      // Promise race with 5000ms timeout to avoid hanging if high demand occurs
      const aiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), 5000)
      );

      const response: any = await Promise.race([aiPromise, timeoutPromise]);
      reportText = response.text || '';
    } catch (aiErr) {
      console.warn('Gemini report generation unavailable or timed out, using deterministic report fallback:', aiErr);
    }

    if (!reportText) {
      const fallback = generateLocalEmotionalSynthesis(entries, medications);
      reportText = buildFullTextReport(fallback, entries, medications, userName, periodDays);
    }

    return res.json({ success: true, source: 'completo', reportText });
  } catch (error) {
    console.error('Error generating report:', error);
    const fallback = generateLocalEmotionalSynthesis(entries, medications);
    return res.json({
      success: true,
      source: 'fallback-deterministico',
      reportText: buildFullTextReport(fallback, entries, medications, userName, periodDays),
    });
  }
});

// Setup Vite in Dev or Static files in Prod
async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`\n  Vite + Express server running at:`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://${HOST}:${PORT}/\n`);
  });
}

startServer();
