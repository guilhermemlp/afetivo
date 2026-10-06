/**
 * Núcleo de humor: escalas, rótulos e derivações.
 *
 * Duas escalas convivem por causa do histórico do v1:
 * - `valence` (atual): de -3 (muito desagradável) a 3 (muito agradável);
 * - `legacy` (antiga): a mesma faixa numérica com os rótulos clínicos antigos,
 *   preservados sem reescrever registros antigos.
 */

export type Valence = -3 | -2 | -1 | 0 | 1 | 2 | 3;
export type Activation = 1 | 2 | 3 | 4 | 5;
export type MoodScale = 'valence' | 'legacy';
export type RecordKind = 'moment' | 'daily_summary';

export const VALENCE_VALUES: readonly Valence[] = [-3, -2, -1, 0, 1, 2, 3];
export const ACTIVATION_VALUES: readonly Activation[] = [1, 2, 3, 4, 5];

export const VALENCE_LABELS: Record<Valence, string> = {
  '-3': 'Muito desagradável',
  '-2': 'Desagradável',
  '-1': 'Um pouco desagradável',
  0: 'Neutro',
  1: 'Um pouco agradável',
  2: 'Agradável',
  3: 'Muito agradável',
};

/** Rótulos da escala antiga, preservados para registros legados. */
export const LEGACY_MOOD_LABELS: Record<Valence, string> = {
  3: 'Energia Muito Alta / Euforia',
  2: 'Muito Animado / Disposto',
  1: 'Levemente Animado',
  0: 'Equilibrado / Neutro',
  '-1': 'Levemente Desanimado',
  '-2': 'Desanimado / Triste',
  '-3': 'Muito Desanimado / Esgotado',
};

export const MOOD_NOT_INFORMED = 'Não informado';

/** Rótulo de exibição de um registro na sua própria escala. */
export function moodLabel(entry: {
  moodScore: number | null | undefined;
  moodScale?: MoodScale | null | undefined;
}): string {
  if (entry.moodScore == null) return MOOD_NOT_INFORMED;
  const labels = entry.moodScale === 'valence' ? VALENCE_LABELS : LEGACY_MOOD_LABELS;
  return labels[entry.moodScore as Valence] ?? MOOD_NOT_INFORMED;
}

/** Faixa clínica aproximada de um valor de humor (usado por gráficos). */
export type MoodZone = 'elevado' | 'equilibrado' | 'baixo';

export function moodZone(moodScore: number | null | undefined): MoodZone | null {
  if (moodScore == null) return null;
  if (moodScore >= 1) return 'elevado';
  if (moodScore <= -1) return 'baixo';
  return 'equilibrado';
}
