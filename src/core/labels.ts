/**
 * Dicionários de rótulos em português usados por toda a interface.
 * Herdados do v1 (services/observations.ts e componentes) sem alteração
 * de significado.
 */

export const OUTCOME_LABELS = {
  urge_reduced: 'A vontade diminuiu',
  paused: 'Fiz uma pausa',
  another_action: 'Escolhi outra ação',
  acted: 'Realizei a ação',
  ongoing: 'Ainda acontecendo',
  unknown: 'Não sei',
} as const;

/** Desfechos de registros antigos que só tinham o campo `resisted`. */
export const RESISTED_LABELS = {
  resisted_fully: 'Não realizei a ação (registro antigo)',
  delayed: 'Adiei a ação (registro antigo)',
  yielded_partially: 'Realizei parte da ação (registro antigo)',
  yielded_fully: 'Realizei a ação (registro antigo)',
} as const;

export const EFFECT_LABELS = {
  helped: 'Ajudou',
  partly: 'Ajudou em parte',
  not_helped: 'Não ajudou',
  unknown: 'Não sei ainda',
} as const;

export const COMPULSION_LABELS = {
  none: 'Não',
  risk: 'Risco / impulso',
  mild: 'Leve',
  yes: 'Sim',
} as const;

export const DOMAIN_LABELS: Record<string, string> = {
  relacionamentos: 'Relacionamentos',
  financeiro: 'Dinheiro / financeiro',
  solidao: 'Solidão / pertencimento',
  trabalho: 'Trabalho / demandas',
  familia: 'Família / ambiente',
  outro: 'Outro',
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
] as const;

export const SLEEP_QUALITY_LABELS = {
  poor: 'Ruim',
  fair: 'Regular',
  good: 'Boa',
  restorative: 'Restauradora',
} as const;

export const ACTIVITY_INTENSITY_LABELS = {
  light: 'Leve',
  moderate: 'Moderada',
  vigorous: 'Intensa',
} as const;

export const MEDICATION_CATEGORY_LABELS = {
  mood_stabilizer: 'Estabilidade & Equilíbrio',
  antidepressant: 'Uso Contínuo / Rotina',
  anxiolytic: 'Momento Pontual / SOS',
  sleep_aid: 'Sono & Relaxamento',
  supplement: 'Suplemento / Vitaminas',
  routine: 'Hábito & Autocuidado',
  other: 'Outro',
} as const;

export const MEDICATION_FREQUENCY_LABELS = {
  daily_morning: 'Manhã (após café)',
  daily_night: 'Noite (antes de dormir)',
  twice_daily: '2x ao dia',
  as_needed: 'SOS / Apenas quando necessário',
} as const;

export const INTAKE_STATUS_LABELS = {
  taken: 'Tomado',
  skipped: 'Pulado',
  delayed: 'Atrasado',
  extra_dose: 'Dose extra',
} as const;

export const MEDICATION_EVENT_KIND_LABELS = {
  intake: 'Tomada',
  adjustment: 'Ajuste de dose',
  pause: 'Pausa',
  resume: 'Retomada',
  side_effect: 'Efeito colateral',
} as const;
