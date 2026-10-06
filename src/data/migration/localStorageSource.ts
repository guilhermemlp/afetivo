import { V1_STORAGE_KEYS, type MigrationOutcome, migrateV1Payload } from './v1';

interface ParsedPayload {
  entries?: unknown;
  medications?: unknown;
  profile?: unknown;
}

function readJson(storage: Storage, key: string): unknown {
  const raw = storage.getItem(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/**
 * Lê do `localStorage` as chaves do v1 (incluindo as anteriores à v2)
 * e monta um payload compatível com `migrateV1Payload`.
 * Retorna `null` quando não há nada para migrar.
 */
export function readV1FromLocalStorage(storage: Storage = window.localStorage): unknown | null {
  const payload: ParsedPayload = {};

  const entries =
    readJson(storage, V1_STORAGE_KEYS.entries) ?? readJson(storage, V1_STORAGE_KEYS.oldEntries);
  if (Array.isArray(entries)) payload.entries = entries;

  const medications =
    readJson(storage, V1_STORAGE_KEYS.medications) ??
    readJson(storage, V1_STORAGE_KEYS.oldMedications);
  if (Array.isArray(medications)) payload.medications = medications;

  const profile =
    readJson(storage, V1_STORAGE_KEYS.profile) ?? readJson(storage, V1_STORAGE_KEYS.oldProfile);
  if (profile && typeof profile === 'object' && !Array.isArray(profile)) payload.profile = profile;

  if (
    payload.entries === undefined &&
    payload.medications === undefined &&
    payload.profile === undefined
  ) {
    return null;
  }
  return payload;
}

/** Lê o `localStorage` do v1 e migra direto para o schema v4. */
export function migrateV1FromLocalStorage(
  storage: Storage = window.localStorage,
): MigrationOutcome | null {
  const payload = readV1FromLocalStorage(storage);
  if (payload == null) return null;
  return migrateV1Payload(payload);
}
