import type { AfetivoEntry, ClinicalPatternAnalysis } from '../types/mood';
import { entriesInPeriod } from './dates';
import { describeEntries, realEntries } from './observations';

export interface PatternAnalysisRequest {
  entries: AfetivoEntry[];
  timeFrameDays: number;
  referenceDate?: Date;
}

export interface PatternAnalysisResult {
  providerId: string;
  analysis: ClinicalPatternAnalysis;
  entriesAnalyzed: number;
}

/**
 * Contract for optional analysis providers.
 *
 * Providers that call an external model must be implemented in a trusted
 * backend or serverless function. API keys must never be included in this
 * browser bundle.
 */
export interface PatternAnalysisProvider {
  readonly id: string;
  analyze(request: PatternAnalysisRequest): Promise<PatternAnalysisResult>;
}

export function analyzePatternsLocally(
  request: PatternAnalysisRequest,
): PatternAnalysisResult {
  const entries = realEntries(
    entriesInPeriod(
      request.entries,
      request.timeFrameDays,
      request.referenceDate ?? new Date(),
    ),
  );
  return {
    providerId: 'local',
    analysis: describeEntries(entries),
    entriesAnalyzed: entries.length,
  };
}

export const localPatternAnalysisProvider: PatternAnalysisProvider = {
  id: 'local',
  async analyze(request) {
    return analyzePatternsLocally(request);
  },
};

export async function analyzeWithProvider(
  request: PatternAnalysisRequest,
  provider: PatternAnalysisProvider = localPatternAnalysisProvider,
): Promise<PatternAnalysisResult> {
  return provider.analyze(request);
}
