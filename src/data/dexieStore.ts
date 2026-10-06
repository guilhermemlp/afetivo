import Dexie, { type Table } from 'dexie';
import type { Entry } from '@/core/entry';
import type { Medication, MedicationEvent } from '@/core/medication';
import { createDefaultProfile, PROFILE_ID, type UserProfile } from '@/core/profile';
import type { Assessment, WarningSign } from '@/core/tracking';
import { makeTombstone, tombstoneId, type SyncCollection, type Tombstone } from './sync/types';
import type { AfetivoStore, Collection } from './store';

class AfetivoDatabase extends Dexie {
  entries!: Table<Entry, string>;
  medications!: Table<Medication, string>;
  medicationEvents!: Table<MedicationEvent, string>;
  warningSigns!: Table<WarningSign, string>;
  assessments!: Table<Assessment, string>;
  profiles!: Table<UserProfile, string>;
  tombstones!: Table<Tombstone, string>;

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
    this.version(2).stores({
      tombstones: 'id, collection, deletedAt',
    });
  }
}

function collectionOf<T extends { id: string }>(
  table: Table<T, string>,
  db: AfetivoDatabase,
  collection: SyncCollection,
  now: () => number,
): Collection<T> {
  return {
    async list() {
      return table.toArray();
    },
    async get(id) {
      return (await table.get(id)) ?? null;
    },
    async put(item) {
      await db.transaction('rw', table, db.tombstones, async () => {
        await table.put(item);
        await db.tombstones.delete(tombstoneId(collection, item.id));
      });
    },
    async putMany(items) {
      await db.transaction('rw', table, db.tombstones, async () => {
        await table.bulkPut(items);
        await db.tombstones.bulkDelete(items.map((item) => tombstoneId(collection, item.id)));
      });
    },
    async delete(id) {
      await db.transaction('rw', table, db.tombstones, async () => {
        await table.delete(id);
        await db.tombstones.put(makeTombstone(collection, id, now()));
      });
    },
    async deleteRaw(id) {
      await table.delete(id);
    },
    async clear() {
      await db.transaction('rw', table, db.tombstones, async () => {
        const items = await table.toArray();
        await table.clear();
        if (items.length > 0) {
          await db.tombstones.bulkPut(
            items.map((item) => makeTombstone(collection, item.id, now())),
          );
        }
      });
    },
  };
}

/** Adaptador local (IndexedDB via Dexie) — fonte de verdade offline. */
export function createDexieStore(name = 'afetivo'): AfetivoStore {
  const db = new AfetivoDatabase(name);
  return {
    entries: collectionOf(db.entries, db, 'entries', Date.now),
    medications: collectionOf(db.medications, db, 'medications', Date.now),
    medicationEvents: collectionOf(db.medicationEvents, db, 'medicationEvents', Date.now),
    warningSigns: collectionOf(db.warningSigns, db, 'warningSigns', Date.now),
    assessments: collectionOf(db.assessments, db, 'assessments', Date.now),
    profile: {
      async get() {
        return (await db.profiles.get(PROFILE_ID)) ?? createDefaultProfile();
      },
      async put(profile) {
        await db.profiles.put(profile);
      },
    },
    tombstones: {
      async list() {
        return db.tombstones.toArray();
      },
      async get(id) {
        return (await db.tombstones.get(id)) ?? null;
      },
      async put(item) {
        await db.tombstones.put(item);
      },
      async putMany(items) {
        await db.tombstones.bulkPut(items);
      },
      async delete(id) {
        await db.tombstones.delete(id);
      },
      async deleteRaw(id) {
        await db.tombstones.delete(id);
      },
      async clear() {
        await db.tombstones.clear();
      },
    },
  };
}
