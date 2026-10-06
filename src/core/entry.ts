import { z } from 'zod';
import { isValidDate, isValidTime, localDate, localTime } from './dates';

/** Versão canônica do formato de registro da reescrita. */
export const ENTRY_SCHEMA_VERSION = 4 as const;

/** Seções opcionais que o formulário pode abrir (semântica do v1:
 * `opened` = a seção foi mostrada; vazio = nunca perguntado). */
export const OPENED_SECTIONS = [
  'context',
  'sleep',
  'impulses',
  'medications',
  'activities',
  'support',
  'focus',
  'notes',
] as const;
export type OpenedSection = (typeof OPENED_SECTIONS)[number];

export const TAG_KINDS = [
  'emotion',
  'somatic',
  'trigger',
  'activity',
  'context',
  'domain',
  'protective',
  'custom',
] as const;
export type TagKind = (typeof TAG_KINDS)[number];

export const tagSchema = z.object({
  kind: z.enum(TAG_KINDS),
  label: z.string().min(1).max(200),
});
export type Tag = z.infer<typeof tagSchema>;

export const physicalActivitySchema = z.object({
  type: z.string().min(1).max(80),
  durationMinutes: z.number().int().min(1).max(1440).nullable().default(null),
  intensity: z.enum(['light', 'moderate', 'vigorous']).nullable().default(null),
  postFeeling: z.string().max(300).nullable().default(null),
});
export type PhysicalActivity = z.infer<typeof physicalActivitySchema>;

export const impulseSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1).max(120),
  intensity: z.number().int().min(1).max(5).nullable().default(null),
  outcome: z
    .enum(['urge_reduced', 'paused', 'another_action', 'acted', 'ongoing', 'unknown'])
    .nullable()
    .default(null),
  resisted: z
    .enum(['resisted_fully', 'delayed', 'yielded_partially', 'yielded_fully'])
    .nullable()
    .default(null),
  copingUsed: z.string().max(500).nullable().default(null),
  trigger: z.string().max(500).nullable().default(null),
  consequence: z.string().max(500).nullable().default(null),
  reflection: z.string().max(1000).nullable().default(null),
});
export type Impulse = z.infer<typeof impulseSchema>;

/** Medições corporais e emocionais. Ausente = `null` (nunca 0). */
export const metricsSchema = z.object({
  sleepHours: z.number().min(0).max(24).nullable().default(null),
  sleepQuality: z.enum(['poor', 'fair', 'good', 'restorative']).nullable().default(null),
  sleepLatencyMinutes: z.number().int().min(0).max(1440).nullable().default(null),
  energy: z.number().int().min(1).max(5).nullable().default(null),
  mentalClarity: z.number().int().min(1).max(5).nullable().default(null),
  anxiety: z.number().int().min(0).max(10).nullable().default(null),
  stress: z.number().int().min(0).max(10).nullable().default(null),
  sadness: z.number().int().min(0).max(10).nullable().default(null),
  irritability: z.number().int().min(0).max(10).nullable().default(null),
  urge: z.number().int().min(0).max(10).nullable().default(null),
  isolation: z.number().int().min(0).max(10).nullable().default(null),
  impulsiveSpending: z.number().min(0).max(1_000_000_000).nullable().default(null),
  timeToBaseline: z.string().max(300).nullable().default(null),
});
export type Metrics = z.infer<typeof metricsSchema>;

const blankMetrics = (): Metrics => ({
  sleepHours: null,
  sleepQuality: null,
  sleepLatencyMinutes: null,
  energy: null,
  mentalClarity: null,
  anxiety: null,
  stress: null,
  sadness: null,
  irritability: null,
  urge: null,
  isolation: null,
  impulsiveSpending: null,
  timeToBaseline: null,
});

/** Cadeia comportamental (detalhe opcional do registro). */
export const chainSchema = z.object({
  urgeDescription: z.string().max(2000).nullable().default(null),
  behaviorDescription: z.string().max(2000).nullable().default(null),
  behaviorFunctions: z.array(z.string().min(1).max(120)).default(() => []),
  behaviorFunctionNote: z.string().max(1000).nullable().default(null),
  consequence: z.string().max(2000).nullable().default(null),
  strategyEffect: z.enum(['helped', 'partly', 'not_helped', 'unknown']).nullable().default(null),
  nextStep: z.string().max(1000).nullable().default(null),
  whatHelpedNotes: z.string().max(2000).nullable().default(null),
});
export type Chain = z.infer<typeof chainSchema>;

const blankChain = (): Chain => ({
  urgeDescription: null,
  behaviorDescription: null,
  behaviorFunctions: [],
  behaviorFunctionNote: null,
  consequence: null,
  strategyEffect: null,
  nextStep: null,
  whatHelpedNotes: null,
});

export const focusSchema = z.object({
  hyperfocusPresent: z.boolean().nullable().default(null),
  hyperfocusNotes: z.string().max(1000).nullable().default(null),
  unmetIntentionNotes: z.string().max(1000).nullable().default(null),
});
export type Focus = z.infer<typeof focusSchema>;

const blankFocus = (): Focus => ({
  hyperfocusPresent: null,
  hyperfocusNotes: null,
  unmetIntentionNotes: null,
});

export const entrySchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(ENTRY_SCHEMA_VERSION),
  /** Data no calendário local (`YYYY-MM-DD`). */
  date: z.string().refine(isValidDate, 'Data inválida'),
  /** Horário local (`HH:mm`). */
  time: z.string().refine(isValidTime, 'Horário inválido'),
  recordKind: z.enum(['moment', 'daily_summary']).default('moment'),
  /** Escala do registro: atual (`valence`) ou preservada do v1 (`legacy`). */
  moodScale: z.enum(['valence', 'legacy']).default('valence'),
  /** Nota de humor na própria escala do registro (`null` = não informado). */
  moodScore: z.number().int().min(-3).max(3).nullable().default(null),
  activationLevel: z.number().int().min(1).max(5).nullable().default(null),
  /** Agitação com desânimo no mesmo momento. */
  isMixedState: z.boolean().nullable().default(null),
  compulsion: z.enum(['none', 'risk', 'mild', 'yes']).nullable().default(null),
  openedSections: z.array(z.enum(OPENED_SECTIONS)).default(() => []),
  tags: z.array(tagSchema).default(() => []),
  physicalActivities: z.array(physicalActivitySchema).default(() => []),
  impulses: z.array(impulseSchema).default(() => []),
  metrics: metricsSchema.default(blankMetrics),
  chain: chainSchema.default(blankChain),
  focus: focusSchema.default(blankFocus),
  journalNotes: z.string().default(''),
  gratitudeNotes: z.string().max(2000).nullable().default(null),
  /** Ids de sinais de alerta precoces marcados neste registro. */
  warningSignIds: z.array(z.string().min(1)).default(() => []),
  /** Dados demonstrativos ficam fora das análises pessoais. */
  isDemo: z.boolean().default(false),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});

export type Entry = z.infer<typeof entrySchema>;

export function parseEntry(value: unknown): Entry {
  return entrySchema.parse(value);
}

/** Registro vazio: nenhuma resposta obrigatória, tudo em `null`. */
export function createBlankEntry(now: Date = new Date()): Entry {
  return entrySchema.parse({
    id: crypto.randomUUID(),
    schemaVersion: ENTRY_SCHEMA_VERSION,
    date: localDate(now),
    time: localTime(now),
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
  });
}

/** Atualiza campos de um registro marcando `updatedAt`. */
export function withUpdates(entry: Entry, updates: Partial<Entry>, now = Date.now()): Entry {
  return entrySchema.parse({ ...entry, ...updates, updatedAt: now });
}
