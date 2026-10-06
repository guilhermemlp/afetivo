import { formatAvg } from '@/core/analysis';
import type { AiAnalysisProvider, AiAnalysisRequest } from './types';

/**
 * Descrição local determinística (fallback do provedor remoto): monta um
 * texto a partir só dos agregados recebidos, sem inventar valores — campos
 * `null` viram "não há dados" e nada recomenda tratamento ou dose.
 */
export function describePeriod(request: AiAnalysisRequest): string {
  const { periodLabel, stats, tags } = request;
  const lines: string[] = [];

  lines.push(`Período analisado: ${periodLabel}.`);
  lines.push(
    `${stats.entryCount} registro(s) em ${stats.daysWithEntries} dia(s) de ${stats.daysInRange} no período.`,
  );

  lines.push(
    stats.avgMood != null
      ? `Humor médio: ${formatAvg(stats.avgMood)} em ${stats.responseCount} resposta(s) com humor informado.`
      : 'Humor médio: não há respostas de humor neste período.',
  );
  lines.push(
    stats.avgActivation != null
      ? `Ativação média: ${formatAvg(stats.avgActivation)} de 1 a 5.`
      : 'Ativação média: não há dados de ativação neste período.',
  );
  lines.push(
    stats.avgSleepHours != null
      ? `Sono médio: ${formatAvg(stats.avgSleepHours)} h.`
      : 'Sono médio: não há dados de sono neste período.',
  );

  const extras: string[] = [];
  if (stats.intakeCount > 0) extras.push(`${stats.intakeCount} tomada(s) registrada(s)`);
  if (stats.impulseCount > 0) extras.push(`${stats.impulseCount} impulso(s) registrado(s)`);
  if (extras.length > 0) lines.push(`${extras.join(' e ')}.`);

  if (tags.length > 0) {
    lines.push(
      `Tags mais frequentes: ${tags.map((tag) => `${tag.label} (${tag.count})`).join(', ')}.`,
    );
  } else {
    lines.push('Nenhuma tag registrada no período.');
  }

  lines.push(
    'Leitura descritiva dos seus registros — não é diagnóstico nem recomendação de medicação.',
  );
  return lines.join('\n');
}

export const localAiProvider: AiAnalysisProvider = {
  id: 'local',
  label: 'Análise local',
  async analyze(request) {
    return {
      providerId: 'local',
      providerLabel: 'Análise local',
      text: describePeriod(request),
      generatedAt: Date.now(),
    };
  },
};
