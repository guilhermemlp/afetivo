import { z } from 'zod';
import { localDate, localTime } from './dates';

export const MEDICATION_CATEGORIES = [
  'mood_stabilizer',
  'antidepressant',
  'anxiolytic',
  'sleep_aid',
  'supplement',
  'routine',
  'other',
] as const;

export const MEDICATION_FREQUENCIES = [
  'daily_morning',
  'daily_night',
  'twice_daily',
  'as_needed',
] as const;

export const medicationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(160),
  category: z.enum(MEDICATION_CATEGORIES).default('other'),
  dosage: z.string().max(160).default(''),
  frequency: z.enum(MEDICATION_FREQUENCIES).default('daily_night'),
  notes: z.string().max(2000).nullable().default(null),
  active: z.boolean().default(true),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});
export type Medication = z.infer<typeof medicationSchema>;

/**
 * Evento de medicação: tomada individual (resolve a limitação do v1, que
 * agregava "2x ao dia" num status só por registro), ajuste de dose, pausa,
 * retomada ou efeito colateral — todos com data e horário próprios.
 */
export const MEDICATION_EVENT_KINDS = [
  'intake',
  'adjustment',
  'pause',
  'resume',
  'side_effect',
] as const;

export const medicationEventSchema = z.object({
  id: z.string().min(1),
  medicationId: z.string().min(1),
  /** Cópia do nome na época do evento (sobrevive à exclusão do catálogo). */
  medicationName: z.string().min(1).max(160),
  kind: z.enum(MEDICATION_EVENT_KINDS),
  date: z.string().min(8),
  time: z.string().min(5),
  /** Dose descrita livremente (ex.: "50 mg", "1 comprimido"). */
  dose: z.string().max(160).nullable().default(null),
  /** Somente em `kind: 'intake'`. */
  status: z.enum(['taken', 'skipped', 'delayed', 'extra_dose']).nullable().default(null),
  sideEffects: z.array(z.string().min(1).max(200)).default(() => []),
  notes: z.string().max(2000).nullable().default(null),
  createdAt: z.number().int().nonnegative(),
  /** Versão do registro para merge LWW no sync (edições criam novo valor). */
  updatedAt: z.number().int().nonnegative(),
});
export type MedicationEvent = z.infer<typeof medicationEventSchema>;

export function parseMedication(value: unknown): Medication {
  return medicationSchema.parse(value);
}

export function createBlankMedication(name: string, now = Date.now()): Medication {
  return medicationSchema.parse({
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
  });
}

export function parseMedicationEvent(value: unknown): MedicationEvent {
  return medicationEventSchema.parse(value);
}

/** Novo evento (data/hora preenchidas com o instante atual quando omitidas). */
export function createMedicationEvent(
  input: {
    medicationId: string;
    medicationName: string;
    kind: MedicationEvent['kind'];
    date?: string;
    time?: string;
    dose?: string | null;
    status?: MedicationEvent['status'];
    sideEffects?: string[];
    notes?: string | null;
  },
  now = Date.now(),
): MedicationEvent {
  return medicationEventSchema.parse({
    ...input,
    id: crypto.randomUUID(),
    date: input.date ?? localDate(new Date(now)),
    time: input.time ?? localTime(new Date(now)),
    createdAt: now,
    updatedAt: now,
  });
}
