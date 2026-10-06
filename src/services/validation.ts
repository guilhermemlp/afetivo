import { moodLabel } from "./observations";
import {
  type AfetivoEntry,
  type Medication,
  type UserProfile,
} from "../types/mood";
import { isValidDate } from "./dates";

function object(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Item de backup inválido.");
  return value;
}

function text(value: unknown, fallback = ""): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") throw new Error("Campo de texto inválido.");
  return value;
}

function number(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (value === undefined) return fallback;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw new Error("Valor numérico fora da faixa permitida.");
  return value;
}

function choice<T extends string>(
  value: unknown,
  choices: readonly T[],
  fallback: T,
): T {
  if (value === undefined) return fallback;
  if (!choices.includes(value as T))
    throw new Error("Opção inválida no backup.");
  return value as T;
}

function list<T>(value: unknown, parse: (item: unknown) => T): T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("Esperada uma lista no backup.");
  return value.map(parse);
}

function bool(value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new Error("Campo booleano inválido.");
  return value;
}

function id(value: unknown): string {
  const result = text(value);
  if (!result.trim()) throw new Error("Item sem identificador.");
  return result;
}

function time(value: unknown, fallback = "21:30"): string {
  const result = text(value, fallback);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(result))
    throw new Error("Horário inválido.");
  return result;
}

function measurement(value: unknown, min: number, max: number): number | null {
  return value == null ? null : number(value, min, max, min);
}

function nullableText(value: unknown): string | null {
  if (value == null) return null;
  const result = text(value);
  return result.trim() ? result : null;
}

export function validateEntries(value: unknown): AfetivoEntry[] {
  const entries = list(value, (item) => {
    const e = object(item);
    if (!isValidDate(e.date)) throw new Error("Data de registro inválida.");
    if (e.moodScore === undefined && e.schemaVersion !== 3)
      throw new Error("Registro sem nota de humor.");
    const score = measurement(e.moodScore, -3, 3);
    if (score !== null && !Number.isInteger(score))
      throw new Error("Nota de humor inválida.");
    const moodScore = score as AfetivoEntry["moodScore"];
    return {
      ...e,
      id: id(e.id),
      date: e.date,
      time: time(e.time),
      moodScore,
      moodScale: choice(e.moodScale, ["legacy", "valence"] as const, "legacy"),
      recordKind:
        e.recordKind === undefined
          ? undefined
          : choice(
              e.recordKind,
              ["moment", "daily_summary"] as const,
              "moment",
            ),
      schemaVersion:
        e.schemaVersion === undefined
          ? undefined
          : e.schemaVersion === 3
            ? 3
            : (() => {
                throw new Error("Versão de registro inválida.");
              })(),
      isDemo: bool(e.isDemo, false),
      activationLevel: measurement(e.activationLevel, 1, 5),
      contexts: list(e.contexts, (v) => text(v)),
      observedSections: list(e.observedSections, (v) =>
        choice(
          v,
          [
            "context",
            "sleep",
            "impulses",
            "medications",
            "activities",
            "support",
            "focus",
            "notes",
          ] as const,
          "notes",
        ),
      ),
      nextStep: e.nextStep === undefined ? undefined : text(e.nextStep),
      strategyEffect:
        e.strategyEffect === undefined
          ? undefined
          : choice(
              e.strategyEffect,
              ["helped", "partly", "not_helped", "unknown"] as const,
              "unknown",
            ),
      moodLabel: text(
        e.moodLabel,
        moodLabel({ moodScore, moodScale: e.moodScale }),
      ),
      isMixedState: e.isMixedState == null ? null : bool(e.isMixedState, false),
      energyLevel: measurement(e.energyLevel, 1, 5),
      anxietyLevel: measurement(e.anxietyLevel, 0, 5),
      irritabilityLevel: measurement(e.irritabilityLevel, 0, 5),
      mentalClarityLevel: (() => {
        const value = measurement(e.mentalClarityLevel, 1, 5);
        if (value !== null && !Number.isInteger(value))
          throw new Error("Clareza mental inválida.");
        return value;
      })(),
      hyperfocusPresent:
        e.hyperfocusPresent == null ? null : bool(e.hyperfocusPresent, false),
      hyperfocusNotes: nullableText(e.hyperfocusNotes),
      unmetIntentionNotes: nullableText(e.unmetIntentionNotes),
      sleepHours: measurement(e.sleepHours, 0, 24),
      sleepQuality:
        e.sleepQuality == null
          ? null
          : choice(
              e.sleepQuality,
              ["poor", "fair", "good", "restorative"] as const,
              "good",
            ),
      sleepLatencyMinutes:
        e.sleepLatencyMinutes === undefined
          ? undefined
          : number(e.sleepLatencyMinutes, 0, 1440, 0),
      emotions: list(e.emotions, (v) => text(v)),
      somaticSymptoms: list(e.somaticSymptoms, (v) => text(v)),
      triggers: list(e.triggers, (v) => text(v)),
      activities: list(e.activities, (v) => text(v)),
      protectiveFactors: list(e.protectiveFactors, (v) => text(v)),
      customTags: list(e.customTags, (v) => text(v)),
      physicalActivities: list(e.physicalActivities, (item) => {
        const w = object(item);
        return {
          ...w,
          type: text(w.type, "Outro"),
          durationMinutes: measurement(w.durationMinutes, 1, 1440),
          intensity:
            w.intensity == null
              ? null
              : choice(
                  w.intensity,
                  ["light", "moderate", "vigorous"] as const,
                  "moderate",
                ),
          postWorkoutFeeling:
            w.postWorkoutFeeling === undefined
              ? undefined
              : text(w.postWorkoutFeeling),
        };
      }),
      impulsiveBehaviors: list(e.impulsiveBehaviors, (item) => {
        const i = object(item);
        return {
          ...i,
          id: id(i.id),
          type: text(i.type, "Outro impulso"),
          intensity: measurement(i.intensity, 1, 5),
          outcome:
            i.outcome === undefined
              ? undefined
              : choice(
                  i.outcome,
                  [
                    "urge_reduced",
                    "paused",
                    "another_action",
                    "acted",
                    "ongoing",
                    "unknown",
                  ] as const,
                  "unknown",
                ),
          resisted:
            i.resisted === undefined
              ? undefined
              : choice(
                  i.resisted,
                  [
                    "resisted_fully",
                    "delayed",
                    "yielded_partially",
                    "yielded_fully",
                  ] as const,
                  "delayed",
                ),
          ...Object.fromEntries(
            ["copingUsed", "trigger", "consequence", "reflection"]
              .filter((k) => i[k] !== undefined)
              .map((k) => [k, text(i[k])]),
          ),
        };
      }),
      medicationIntakes: list(e.medicationIntakes, (item) => {
        const m = object(item);
        return {
          ...m,
          medicationId: id(m.medicationId),
          medicationName: text(m.medicationName),
          status: choice(
            m.status ?? "__missing__",
            ["taken", "skipped", "delayed", "extra_dose"] as const,
            "taken",
          ),
          timeTaken: m.timeTaken ? time(m.timeTaken) : undefined,
          sideEffects: list(m.sideEffects, (v) => text(v)),
        };
      }),
      journalNotes: text(e.journalNotes),
      gratitudeNotes:
        e.gratitudeNotes === undefined ? undefined : text(e.gratitudeNotes),
      whatHelpedNotes:
        e.whatHelpedNotes === undefined ? undefined : text(e.whatHelpedNotes),
      createdAt: number(
        e.createdAt,
        0,
        Number.MAX_SAFE_INTEGER,
        new Date(`${e.date}T12:00:00`).getTime(),
      ),
    } as AfetivoEntry;
  });
  uniqueIds(entries);
  return entries;
}

export function validateMedications(value: unknown): Medication[] {
  const meds = list(value, (item) => {
    const m = object(item);
    const name = text(m.name);
    if (!name.trim()) throw new Error("Medicamento sem nome.");
    return {
      ...m,
      id: id(m.id),
      name,
      category: choice(
        m.category,
        [
          "mood_stabilizer",
          "antidepressant",
          "anxiolytic",
          "sleep_aid",
          "supplement",
          "routine",
          "other",
        ] as const,
        "other",
      ),
      frequency: choice(
        m.frequency,
        ["daily_morning", "daily_night", "twice_daily", "as_needed"] as const,
        "daily_night",
      ),
      dosage: text(m.dosage),
      active: bool(m.active, true),
      notes: m.notes === undefined ? undefined : text(m.notes),
    } as Medication;
  });
  uniqueIds(meds);
  return meds;
}

function uniqueIds(items: { id: string }[]) {
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error("Identificadores duplicados no backup.");
}

export function validateProfile(value: unknown): UserProfile {
  const p = object(value);
  return {
    name: text(p.name, "Guilherme"),
    notes: p.notes === undefined ? undefined : text(p.notes),
    notificationsEnabled: bool(p.notificationsEnabled, false),
  };
}
