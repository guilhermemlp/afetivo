import Dexie, { type Table } from 'dexie';
import type { Entry } from '@/core/entry';
import type { Medication, MedicationEvent } from '@/core/medication';
import { createDefaultProfile, PROFILE_ID, type UserProfile } from '@/core/profile';
import type { Assessment, WarningSign } from '@/core/tracking';
import type { AfetivoStore, Collection } from './store';

class AfetivoDatabase extends Dexie {
  entries!: Table<Entry, string>;
  medications!: Table<Medication, string>;
  medicationEvents!: Table<MedicationEvent, string>;
  warningSigns!: Table<WarningSign, string>;
  assessments!: Table<Assessment, string>;
  profiles!: Table<UserProfile, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      entries: 'id, date, createdAt',
      medications: 'id, name, active',
      medicationEvents: 'id, medicationId, date, kind, createdAt',
      warningSigns: 'id, active',
      assessments: 'id, date, instrument',
      profiles: 'id',
    });
  }
}

function collectionOf<T extends { id: string }>(table: Table<T, string>): Collection<T> {
  return {
    async list() {
      return table.toArray();
    },
    async get(id) {
      return (await table.get(id)) ?? null;
    },
    async put(item) {
      await table.put(item);
    },
    async putMany(items) {
      await table.bulkPut(items);
    },
    async delete(id) {
      await table.delete(id);
    },
    async clear() {
      await table.clear();
    },
  };
}

/** Adaptador local (IndexedDB via Dexie) — fonte de verdade offline. */
export function createDexieStore(name = 'afetivo'): AfetivoStore {
  const db = new AfetivoDatabase(name);
  return {
    entries: collectionOf(db.entries),
    medications: collectionOf(db.medications),
    medicationEvents: collectionOf(db.medicationEvents),
    warningSigns: collectionOf(db.warningSigns),
    assessments: collectionOf(db.assessments),
    profile: {
      async get() {
        return (await db.profiles.get(PROFILE_ID)) ?? createDefaultProfile();
      },
      async put(profile) {
        await db.profiles.put(profile);
      },
    },
  };
}
