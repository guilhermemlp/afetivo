export const APP_NAME = 'Afetivo';

export interface PeriodOption {
  /** Número de dias do calendário ou `null` para todo o histórico. */
  readonly days: number | null;
  readonly label: string;
}

/**
 * Períodos de análise — fonte única de verdade (o v1 tinha esta lista
 * duplicada no dashboard e no analisador de padrões).
 */
export const PERIOD_OPTIONS = [
  { days: 7, label: '7 dias' },
  { days: 14, label: '14 dias' },
  { days: 30, label: '30 dias' },
  { days: null, label: 'Todo o histórico' },
] as const satisfies readonly PeriodOption[];

export const DISCLAIMER =
  'O Afetivo é uma ferramenta pessoal de autorregistro. Não substitui avaliação profissional, diagnóstico, tratamento ou orientação de medicação.';
