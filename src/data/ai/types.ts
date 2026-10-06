import type { PeriodStats, TagCount } from '@/core/analysis';

/**
 * Contrato do provedor de análise (v1: `PatternAnalysisProvider`).
 *
 * Só agregados saem do dispositivo (contagens, médias e labels de tags) —
 * nunca notas, journal ou campos livres. A chave de API, se houver, fica
 * exclusivamente no servidor (Edge Function), nunca em env `VITE_*`.
 */
export interface AiAnalysisRequest {
  /** Janela analisada em dias ou `null` = todo o histórico. */
  periodDays: number | null;
  /** Rótulo legível da janela (ex.: "7 dias", "Todo o histórico"). */
  periodLabel: string;
  stats: PeriodStats;
  tags: TagCount[];
}

export interface AiAnalysisResult {
  providerId: string;
  providerLabel: string;
  text: string;
  generatedAt: number;
  /** Presente quando a IA remota não foi usada e por quê. */
  fallback?: 'not_configured' | 'remote_failed';
}

export type AiErrorKind = 'not_configured' | 'network' | 'invalid_response';

export class AiAnalysisError extends Error {
  constructor(
    readonly kind: AiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'AiAnalysisError';
  }
}

export interface AiAnalysisProvider {
  readonly id: string;
  readonly label: string;
  analyze(request: AiAnalysisRequest): Promise<AiAnalysisResult>;
}
