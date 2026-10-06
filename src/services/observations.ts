import {
  MOOD_LEVEL_CONFIG,
  type AfetivoEntry,
  type ImpulsiveBehavior,
  type ClinicalPatternAnalysis,
} from '../types/mood';
import { entriesInPeriod } from './dates';

export const VALENCE_LABELS: Record<number, string> = {
  '-3': 'Muito desagradável',
  '-2': 'Desagradável',
  '-1': 'Um pouco desagradável',
  0: 'Neutro',
  1: 'Um pouco agradável',
  2: 'Agradável',
  3: 'Muito agradável',
};
export const CONTEXT_OPTIONS = [
  'Começar uma tarefa',
  'Trocar de tarefa',
  'Interrupções',
  'Muitas coisas ao mesmo tempo',
  'Sobrecarga de sons ou estímulos',
  'Interação difícil',
  'Algo agradável',
  'Não sei',
];
export const OUTCOME_LABELS = {
  urge_reduced: 'A vontade diminuiu',
  paused: 'Fiz uma pausa',
  another_action: 'Escolhi outra ação',
  acted: 'Realizei a ação',
  ongoing: 'Ainda acontecendo',
  unknown: 'Não sei',
};
export const EFFECT_LABELS = {
  helped: 'Ajudou',
  partly: 'Ajudou em parte',
  not_helped: 'Não ajudou',
  unknown: 'Não sei ainda',
};
export function moodLabel(
  entry: Pick<AfetivoEntry, 'moodScore' | 'moodScale'>,
): string {
  if (entry.moodScore == null) return 'Não informado';
  return entry.moodScale === 'valence'
    ? VALENCE_LABELS[entry.moodScore]
    : (MOOD_LEVEL_CONFIG[entry.moodScore]?.label ?? 'Não informado');
}
export function impulseLabel(i: ImpulsiveBehavior): string {
  if (i.outcome) return OUTCOME_LABELS[i.outcome];
  if (!i.resisted) return 'Desfecho não informado';
  return (
    {
      resisted_fully: 'Não realizei a ação (registro antigo)',
      delayed: 'Adiei a ação (registro antigo)',
      yielded_partially: 'Realizei parte da ação (registro antigo)',
      yielded_fully: 'Realizei a ação (registro antigo)',
    }[i.resisted] ?? 'Desfecho não informado'
  );
}
export function realEntries(entries: AfetivoEntry[]): AfetivoEntry[] {
  return entries.filter((e) => !e.isDemo);
}
export function measurementSummary(
  entries: AfetivoEntry[],
  key:
    | 'moodScore'
    | 'activationLevel'
    | 'sleepHours'
    | 'anxietyLevel'
    | 'energyLevel'
    | 'mentalClarityLevel',
) {
  const measured = entries.filter(
    (e) => typeof e[key] === 'number' && Number.isFinite(e[key]),
  );
  return {
    count: measured.length,
    days: new Set(measured.map((e) => e.date)).size,
    missing: entries.length - measured.length,
    mean: measured.length
      ? measured.reduce((sum, e) => sum + (e[key] as number), 0) /
        measured.length
      : null,
  };
}
function frequencies(
  entries: AfetivoEntry[],
  getter: (e: AfetivoEntry) => string[],
) {
  const counts = new Map<string, number>();
  entries.forEach((e) =>
    new Set(getter(e)).forEach((v) => {
      if (v.trim()) counts.set(v, (counts.get(v) ?? 0) + 1);
    }),
  );
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => `${name}: ${n} de ${entries.length} registros`);
}
export function describeEntries(
  input: AfetivoEntry[],
): ClinicalPatternAnalysis {
  const entries = realEntries(input),
    days = new Set(entries.map((e) => e.date)).size;
  const moments = entries.filter((e) => e.recordKind === 'moment').length;
  const summaries = entries.filter(
    (e) => e.recordKind === 'daily_summary',
  ).length;
  const sleep = measurementSummary(entries, 'sleepHours');
  const mentalClarity = measurementSummary(entries, 'mentalClarityLevel');
  const valence = entries.filter((e) => e.moodScale === 'valence');
  const mood = measurementSummary(valence, 'moodScore'),
    activation = measurementSummary(valence, 'activationLevel');
  const workouts = entries.filter((e) => e.physicalActivities?.length);
  const helped = entries.filter(
    (e) => e.strategyEffect === 'helped' || e.strategyEffect === 'partly',
  );
  const summary = entries.length
    ? `${entries.length} registros em ${days} dias: ${moments} momentos, ${summaries} resumos do dia e ${entries.length - moments - summaries} registros antigos sem tipo definido. Registros repetidos no mesmo dia não são dias independentes.`
    : 'Nenhum registro pessoal no período. Você pode retomar quando fizer sentido.';
  return {
    resumo_geral: summary,
    summary,
    correlacoes_principais: [],
    gatilhos_mais_frequentes: frequencies(entries, (e) => [
      ...(e.contexts ?? []),
      ...e.triggers,
    ]),
    protecoes_mais_eficazes: frequencies(
      helped,
      (e) => e.protectiveFactors ?? [],
    ),
    sinais_de_alerta_previos: [],
    estrategias_praticas: [],
    observacao_exercicio: `${workouts.length} de ${entries.length} registros mencionam atividade física. Ausência de preenchimento não significa ausência de atividade. Não é possível atribuir mudanças no humor ao exercício com esses dados.`,
    ponto_positivo:
      'Você escolhe o que registrar e quando retomar. Sentimentos desagradáveis também são informações úteis.',
    patterns: [
      `Humor agradável/desagradável: ${mood.count} respostas em ${mood.days} dias; ${mood.missing} sem resposta entre ${valence.length} registros da nova escala.`,
      `Ativação: ${activation.count} respostas; ${activation.missing} sem resposta na nova escala.`,
      `Sono: ${sleep.count} respostas em ${sleep.days} dias; ${sleep.missing} sem resposta.`,
      `Clareza mental: ${mentalClarity.count} respostas; ${mentalClarity.missing} sem resposta.`,
      `${entries.filter((e) => e.moodScale !== 'valence').length} registros da escala antiga, mantidos separados.`,
      `Contextos frequentes são relatos, sem comprovação de causa. Frequência de estratégia não demonstra eficácia.`,
    ],
  };
}
function describeRecord(e: AfetivoEntry): string {
  const kind =
    e.recordKind === 'moment'
      ? 'Momento'
      : e.recordKind === 'daily_summary'
        ? 'Resumo do dia'
        : 'Registro antigo';
  const quality = {
    poor: 'Ruim',
    fair: 'Regular',
    good: 'Boa',
    restorative: 'Restauradora',
  };
  const medStatus = {
    taken: 'Tomado / realizado',
    skipped: 'Não tomado / realizado',
    delayed: 'Atrasado',
    extra_dose: 'Dose adicional registrada',
  };
  return [
    `${e.date} ${e.time} — ${kind}`,
    `Humor: ${moodLabel(e)} (${e.moodScale === 'valence' ? 'agradável/desagradável' : 'escala antiga'}); ativação: ${e.activationLevel ?? 'não informada'}.`,
    `Emoções: ${e.emotions.join(', ') || 'não informadas'}.`,
    `Contexto: ${[...(e.contexts ?? []), ...e.triggers].join('; ') || 'não informado'}.`,
    `Energia física: ${e.energyLevel ?? 'não informada'}; ansiedade: ${e.anxietyLevel ?? 'não informada'}; irritabilidade: ${e.irritabilityLevel ?? 'não informada'}.`,
    `Clareza mental: ${e.mentalClarityLevel ?? 'não informada'}${e.mentalClarityLevel == null ? '' : '/5'}.`,
    `Hiperfoco percebido: ${e.hyperfocusPresent == null ? 'não informado' : e.hyperfocusPresent ? 'sim' : 'não'}${e.hyperfocusNotes ? `; descrição: ${e.hyperfocusNotes}` : ''}.`,
    ...(e.unmetIntentionNotes
      ? [`Atividade pretendida e não concluída: ${e.unmetIntentionNotes}`]
      : []),
    `Sono: ${e.sleepHours == null ? 'não informado' : `${e.sleepHours}h`}; qualidade: ${e.sleepQuality ? quality[e.sleepQuality] : 'não informada'}.`,
    `Notas: ${e.journalNotes || 'não informadas'}`,
    ...(e.whatHelpedNotes ? [`Apoio relatado: ${e.whatHelpedNotes}`] : []),
    ...(e.strategyEffect
      ? [`Avaliação do apoio: ${EFFECT_LABELS[e.strategyEffect]}`]
      : []),
    ...(e.nextStep ? [`Próximo passo escolhido: ${e.nextStep}`] : []),
    `Atividades físicas: ${e.physicalActivities?.map((w) => `${w.type || 'sem descrição'} (${w.durationMinutes == null ? 'duração não informada' : `${w.durationMinutes} min`})`).join('; ') || 'não informadas'}.`,
    `Impulsos: ${e.impulsiveBehaviors.map((i) => `${i.type || 'sem descrição'}: ${impulseLabel(i)}${i.copingUsed ? `; estratégia: ${i.copingUsed}` : ''}`).join('; ') || (e.observedSections?.includes('impulses') ? 'nenhum relatado' : 'não informados')}.`,
    `Medicações/rotina: ${e.medicationIntakes.map((m) => `${m.medicationName}: ${medStatus[m.status]}${m.timeTaken ? ` às ${m.timeTaken}` : ''}`).join('; ') || 'não informadas'}.`,
  ].join('\n');
}

export function buildDeterministicReport(
  input: AfetivoEntry[],
  medications: unknown[],
  name: string,
  periodDays: number,
  now = new Date(),
): string {
  const filtered = entriesInPeriod(input, periodDays, now),
    entries = realEntries(filtered);
  const analysis = describeEntries(entries);
  const sleep = measurementSummary(entries, 'sleepHours');
  const impulseAnswered = entries.filter((e) =>
    e.observedSections?.includes('impulses'),
  );
  const counted = entries.filter((e) => e.impulsiveBehaviors.length);
  const noImpulse = impulseAnswered.filter(
    (e) => !e.impulsiveBehaviors.length,
  ).length;
  const mean =
    sleep.mean == null
      ? 'não informada'
      : `${sleep.mean.toFixed(1)} horas por registro preenchido (não por noite independente)`;
  return `AFETIVO — RESUMO DESCRITIVO DO DIÁRIO\nNome: ${name}\nPeríodo: ${periodDays ? `últimos ${periodDays} dias` : 'todo o histórico'}\n\n${analysis.resumo_geral}\n${filtered.length - entries.length} exemplos fictícios excluídos.\n\nCOBERTURA DAS RESPOSTAS\n${(analysis.patterns ?? []).join('\n')}\nSono médio: ${mean}.\nImpulsos: ${counted.length} registros com ocorrências; ${noImpulse} respostas explícitas sem ocorrência. Os demais não confirmam ausência.\n\nCONTEXTOS RELATADOS (SEM INFERÊNCIA DE CAUSA)\n${analysis.gatilhos_mais_frequentes.join('\n') || 'Nenhum contexto informado.'}\n\nAPOIOS QUE A PESSOA AVALIOU COMO ÚTEIS\n${analysis.protecoes_mais_eficazes.join('\n') || 'Nenhum apoio com avaliação explícita de ajuda.'}\nAs avaliações são subjetivas; não comprovam eficácia terapêutica.\n\nATIVIDADE FÍSICA\n${analysis.observacao_exercicio}\n\nREGISTROS (MOMENTOS E RESUMOS DO DIA SEPARADOS)\n${entries.map(describeRecord).join('\n\n') || 'Nenhum registro pessoal.'}\n\nLIMITES\nEscalas de autorregistro próprias, sem validação clínica. Respostas ausentes não são zero. Não foram calculados escores de estabilidade, prognósticos, relações causais ou recomendações de dose. ${medications.length} itens cadastrados não comprovam uso ou adesão.\n\nPARA UMA CONVERSA, SE VOCÊ QUISER\nQue situações merecem contexto? O que você percebeu como útil? Há algo que gostaria de levar ao profissional que acompanha você?`;
}
