import { z } from 'zod';

/**
 * Sinais de alerta precoces pessoais (ex.: "dormir menos", "cancelar
 * compromissos") — marcados diretamente nos registros para que o padrão
 * apareça durante a queda, não só em retrospecto.
 */
export const warningSignSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(120),
  active: z.boolean().default(true),
  createdAt: z.number().int().nonnegative(),
});
export type WarningSign = z.infer<typeof warningSignSchema>;

export function parseWarningSign(value: unknown): WarningSign {
  return warningSignSchema.parse(value);
}

/**
 * Instrumentos datados (PHQ-9, GAD-7 ou personalizado). O escore é apenas
 * registrado com data — a interpretação é sempre do profissional.
 */
export const assessmentSchema = z.object({
  id: z.string().min(1),
  instrument: z.enum(['phq9', 'gad7', 'custom']),
  /** Rótulo livre para instrumentos personalizados. */
  instrumentLabel: z.string().max(80).nullable().default(null),
  date: z.string().min(8),
  score: z.number().int().min(0).max(100),
  maxScore: z.number().int().min(1).max(100).nullable().default(null),
  answers: z.record(z.string(), z.number()).nullable().default(null),
  notes: z.string().max(2000).nullable().default(null),
  createdAt: z.number().int().nonnegative(),
});
export type Assessment = z.infer<typeof assessmentSchema>;

export function parseAssessment(value: unknown): Assessment {
  return assessmentSchema.parse(value);
}
