import {
  OPENED_SECTIONS,
  entrySchema,
  type Entry,
  type Impulse,
  type OpenedSection,
  type PhysicalActivity,
  type Tag,
} from '@/core/entry';
import { isValidDate, isValidTime } from '@/core/dates';
import {
  MEDICATION_CATEGORIES,
  MEDICATION_FREQUENCIES,
  medicationEventSchema,
  medicationSchema,
  type Medication,
  type MedicationEvent,
} from '@/core/medication';
import { PROFILE_ID, profileSchema, type UserProfile } from '@/core/profile';

/**
 * Migração do formato v1/v2/v3 (localStorage `afetivo_*_v2` e backups JSON)
 * para o schema canônico v4.
 *
 * Princípios:
 * - um registro corrompido nunca derruba a migração inteira (v1 era
 *   tudo-ou-nada): registros inválidos entram em `skipped` e o resto importa;
 * - campos numéricos fora da faixa viram `null` (preserva o registro);
 * - escalas antigas 0–5 são lineares para 0–10 (×2), e a escala 0–10 já
 *   existente tem precedência quando as duas coexistem;
 * - textos do usuário nunca são reescritos.
 */

export const V1_STORAGE_KEYS = {
  entries: 'afetivo_entries_v2',
  medications: 'afetivo_medications_v2',
  profile: 'afetivo_user_profile_v2',
  oldEntries: 'afetivo_entries_v1',
  oldMedications: 'afetivo_medications_v1',
  oldProfile: 'afetivo_patient_profile_v1',
} as const;

type Raw = Record<string, unknown>;

function asRecord(value: unknown): Raw | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Raw;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  return value >= min && value <= max ? value : null;
}

function readNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value >= min && value <= max ? value : null;
}

function readBool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function readEnum<T extends string>(value: unknown, values: readonly T[]): T | null {
  return typeof value === 'string' && (values as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function readTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const item of value) {
    const text = readText(item);
    if (text && !result.includes(text)) result.push(text);
  }
  return result;
}

/** Escala antiga 0–5 → escala canônica 0–10 (mapeamento linear). */
function scale5to10(value: number | null): number | null {
  return value == null ? null : Math.min(10, value * 2);
}

export interface MigratedEntry {
  entry: Entry;
  /** Tomadas do registro viram eventos de medicação independentes. */
  intakeEvents: MedicationEvent[];
}

export function migrateEntry(raw: unknown): MigratedEntry {
  const source = asRecord(raw);
  if (!source) throw new Error('Registro não é um objeto.');

  const id = readText(source.id);
  if (!id) throw new Error('Registro sem identificador.');
  if (!isValidDate(source.date)) throw new Error('Data de registro inválida.');
  const date = source.date;
  const time = isValidTime(source.time) ? source.time : '21:30';

  const createdAt =
    readNumber(source.createdAt, 0, Number.MAX_SAFE_INTEGER) ??
    new Date(`${date}T12:00:00`).getTime();

  const domainFlags = readTextList(source.domainFlags);
  const domainOther = readText(source.domainOther);
  const tagGroups: Array<[Tag['kind'], unknown]> = [
    ['context', source.contexts],
    ['emotion', source.emotions],
    ['somatic', source.somaticSymptoms],
    ['trigger', source.triggers],
    ['activity', source.activities],
    ['domain', domainFlags],
    ['domain', domainOther ? [domainOther] : []],
    ['protective', source.protectiveFactors],
    ['custom', source.customTags],
  ];
  const seenTags = new Set<string>();
  const tags: Tag[] = [];
  for (const [kind, value] of tagGroups) {
    for (const label of readTextList(value)) {
      const key = `${kind}:${label.toLowerCase()}`;
      if (seenTags.has(key)) continue;
      seenTags.add(key);
      tags.push({ kind, label });
    }
  }

  const openedSections = readTextList(source.observedSections).filter(
    (section): section is OpenedSection => (OPENED_SECTIONS as readonly string[]).includes(section),
  );

  const physicalActivities: PhysicalActivity[] = [];
  if (Array.isArray(source.physicalActivities)) {
    for (const rawActivity of source.physicalActivities) {
      const activity = asRecord(rawActivity);
      if (!activity) continue;
      physicalActivities.push({
        type: readText(activity.type) ?? 'Outro',
        durationMinutes: readInt(activity.durationMinutes, 1, 1440),
        intensity: readEnum(activity.intensity, ['light', 'moderate', 'vigorous']),
        postFeeling: readText(activity.postWorkoutFeeling),
      });
    }
  }

  const impulses: Impulse[] = [];
  if (Array.isArray(source.impulsiveBehaviors)) {
    let index = 0;
    for (const rawImpulse of source.impulsiveBehaviors) {
      const impulse = asRecord(rawImpulse);
      const impulseIndex = index++;
      if (!impulse) continue;
      impulses.push({
        id: readText(impulse.id) ?? `${id}:impulso:${impulseIndex}`,
        type: readText(impulse.type) ?? 'Outro impulso',
        intensity: readInt(impulse.intensity, 1, 5),
        outcome: readEnum(impulse.outcome, [
          'urge_reduced',
          'paused',
          'another_action',
          'acted',
          'ongoing',
          'unknown',
        ]),
        resisted: readEnum(impulse.resisted, [
          'resisted_fully',
          'delayed',
          'yielded_partially',
          'yielded_fully',
        ]),
        copingUsed: readText(impulse.copingUsed),
        trigger: readText(impulse.trigger),
        consequence: readText(impulse.consequence),
        reflection: readText(impulse.reflection),
      });
    }
  }

  // v1: ansiedade tinha duas escalas (0–10 no registro rápido e 0–5 no
  // bem-estar); a 0–10 tem precedência sobre o dobro da antiga.
  const anxiety =
    readInt(source.anxietyScore, 0, 10) ?? scale5to10(readInt(source.anxietyLevel, 0, 5));

  const behaviorFunctions =
    source.behaviorFunctions != null
      ? readTextList(source.behaviorFunctions)
      : readTextList([source.behaviorFunction]);

  const entry = entrySchema.parse({
    id,
    schemaVersion: 4,
    date,
    time,
    recordKind: readEnum(source.recordKind, ['moment', 'daily_summary']) ?? 'moment',
    moodScale: readEnum(source.moodScale, ['valence', 'legacy']) ?? 'legacy',
    moodScore: readInt(source.moodScore, -3, 3),
    activationLevel: readInt(source.activationLevel, 1, 5),
    isMixedState: readBool(source.isMixedState),
    compulsion: readEnum(source.compulsionLevel, ['none', 'risk', 'mild', 'yes']),
    openedSections,
    tags,
    physicalActivities,
    impulses,
    metrics: {
      sleepHours: readNumber(source.sleepHours, 0, 24),
      sleepQuality: readEnum(source.sleepQuality, ['poor', 'fair', 'good', 'restorative']),
      sleepLatencyMinutes: readInt(source.sleepLatencyMinutes, 0, 1440),
      energy: readInt(source.energyLevel, 1, 5),
      mentalClarity: readInt(source.mentalClarityLevel, 1, 5),
      anxiety,
      stress: readInt(source.stressScore, 0, 10),
      sadness: readInt(source.sadnessScore, 0, 10),
      irritability: scale5to10(readInt(source.irritabilityLevel, 0, 5)),
      urge: readInt(source.urgeScore, 0, 10),
      isolation: readInt(source.isolationScore, 0, 10),
      impulsiveSpending: readNumber(source.impulsiveSpending, 0, 1_000_000_000),
      timeToBaseline: readText(source.timeToBaseline),
    },
    chain: {
      urgeDescription: readText(source.urgeDescription),
      behaviorDescription: readText(source.behaviorDescription),
      behaviorFunctions,
      behaviorFunctionNote:
        readText(source.behaviorFunctionNote) ?? readText(source.behaviorFunctionNotes),
      consequence: readText(source.consequence),
      strategyEffect: readEnum(source.strategyEffect, [
        'helped',
        'partly',
        'not_helped',
        'unknown',
      ]),
      nextStep: readText(source.nextStep),
      whatHelpedNotes: readText(source.whatHelpedNotes),
    },
    focus: {
      hyperfocusPresent: readBool(source.hyperfocusPresent),
      hyperfocusNotes: readText(source.hyperfocusNotes),
      unmetIntentionNotes: readText(source.unmetIntentionNotes),
    },
    journalNotes: typeof source.journalNotes === 'string' ? source.journalNotes : '',
    gratitudeNotes: readText(source.gratitudeNotes),
    warningSignIds: [],
    isDemo: source.isDemo === true,
    createdAt,
    updatedAt: readNumber(source.updatedAt, 0, Number.MAX_SAFE_INTEGER) ?? createdAt,
  });

  const intakeEvents: MedicationEvent[] = [];
  if (Array.isArray(source.medicationIntakes)) {
    let index = 0;
    for (const rawIntake of source.medicationIntakes) {
      const intake = asRecord(rawIntake);
      const intakeIndex = index++;
      if (!intake) continue;
      const medicationId = readText(intake.medicationId);
      const medicationName = readText(intake.medicationName);
      if (!medicationId || !medicationName) continue;
      intakeEvents.push(
        medicationEventSchema.parse({
          id: `${id}:tomada:${intakeIndex}:${medicationId}`,
          medicationId,
          medicationName,
          kind: 'intake',
          date,
          time: isValidTime(intake.timeTaken) ? intake.timeTaken : time,
          dose: null,
          status: readEnum(intake.status, ['taken', 'skipped', 'delayed', 'extra_dose']) ?? 'taken',
          sideEffects: readTextList(intake.sideEffects),
          notes: null,
          createdAt,
        }),
      );
    }
  }

  return { entry, intakeEvents };
}

export function migrateMedication(raw: unknown, now = Date.now()): Medication {
  const source = asRecord(raw);
  if (!source) throw new Error('Medicamento não é um objeto.');
  const id = readText(source.id);
  if (!id) throw new Error('Medicamento sem identificador.');
  const name = readText(source.name);
  if (!name) throw new Error('Medicamento sem nome.');

  const createdAt = readNumber(source.createdAt, 0, Number.MAX_SAFE_INTEGER) ?? now;
  return medicationSchema.parse({
    id,
    name,
    category: readEnum(source.category, MEDICATION_CATEGORIES) ?? 'other',
    dosage: typeof source.dosage === 'string' ? source.dosage : '',
    frequency: readEnum(source.frequency, MEDICATION_FREQUENCIES) ?? 'daily_night',
    notes: readText(source.notes),
    active: source.active !== false,
    startDate: isValidDate(source.startDate) ? source.startDate : null,
    endDate: isValidDate(source.endDate) ? source.endDate : null,
    createdAt,
    updatedAt: readNumber(source.updatedAt, 0, Number.MAX_SAFE_INTEGER) ?? createdAt,
  });
}

export function migrateProfile(raw: unknown, now = Date.now()): UserProfile {
  const source = asRecord(raw);
  if (!source) throw new Error('Perfil inválido.');
  return profileSchema.parse({
    id: PROFILE_ID,
    // O v1 usava 'Guilherme' como padrão; no v4 o nome começa em null e só
    // existe se a pessoa informar.
    displayName: readText(source.name),
    notes: readText(source.notes),
    remindersOptIn: source.notificationsEnabled === true,
    createdAt: now,
    updatedAt: now,
  });
}

export interface SkippedItem {
  kind: 'entry' | 'medication' | 'profile';
  index: number;
  id: string | null;
  reason: string;
}

export interface MigrationOutcome {
  entries: Entry[];
  medicationEvents: MedicationEvent[];
  medications: Medication[];
  profile: UserProfile | null;
  skipped: SkippedItem[];
}

/**
 * Aceita o payload de backup do v1 (`{version, entries, medications, profile}`)
 * ou um array puro de registros. Lança erro só se o formato for irreconhecível.
 */
export function migrateV1Payload(payload: unknown, now = Date.now()): MigrationOutcome {
  const root = asRecord(payload);
  if (root == null && !Array.isArray(payload)) {
    throw new Error('Formato de backup não reconhecido.');
  }
  const source = root ?? {};

  const entriesRaw = Array.isArray(payload)
    ? payload
    : Array.isArray(source.entries)
      ? source.entries
      : [];
  const medicationsRaw = Array.isArray(source.medications) ? source.medications : [];
  const profileRaw = source.profile ?? null;

  const outcome: MigrationOutcome = {
    entries: [],
    medicationEvents: [],
    medications: [],
    profile: null,
    skipped: [],
  };

  const seenEntryIds = new Set<string>();
  entriesRaw.forEach((raw, index) => {
    try {
      const { entry, intakeEvents } = migrateEntry(raw);
      if (seenEntryIds.has(entry.id)) {
        outcome.skipped.push({
          kind: 'entry',
          index,
          id: entry.id,
          reason: 'Identificador duplicado.',
        });
        return;
      }
      seenEntryIds.add(entry.id);
      outcome.entries.push(entry);
      outcome.medicationEvents.push(...intakeEvents);
    } catch (error) {
      outcome.skipped.push({
        kind: 'entry',
        index,
        id: readText(asRecord(raw)?.id),
        reason: errorMessage(error),
      });
    }
  });

  const seenMedicationIds = new Set<string>();
  medicationsRaw.forEach((raw, index) => {
    try {
      const medication = migrateMedication(raw, now);
      if (seenMedicationIds.has(medication.id)) {
        outcome.skipped.push({
          kind: 'medication',
          index,
          id: medication.id,
          reason: 'Identificador duplicado.',
        });
        return;
      }
      seenMedicationIds.add(medication.id);
      outcome.medications.push(medication);
    } catch (error) {
      outcome.skipped.push({
        kind: 'medication',
        index,
        id: readText(asRecord(raw)?.id),
        reason: errorMessage(error),
      });
    }
  });

  if (profileRaw != null) {
    try {
      outcome.profile = migrateProfile(profileRaw, now);
    } catch (error) {
      outcome.skipped.push({ kind: 'profile', index: 0, id: null, reason: errorMessage(error) });
    }
  }

  return outcome;
}
