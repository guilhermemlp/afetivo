import type { Entry } from '@/core/entry';
import type { Medication, MedicationEvent } from '@/core/medication';
import { createDefaultProfile, type UserProfile } from '@/core/profile';
import type { Assessment, WarningSign } from '@/core/tracking';
import { makeTombstone, tombstoneId, type SyncCollection, type Tombstone } from './sync/types';
import type { AfetivoStore, Collection, ProfileStore } from './store';

interface CollectionHooks {
  onPut?: (id: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
}

class MemoryCollection<T extends { id: string }> implements Collection<T> {
  private readonly items = new Map<string, T>();

  constructor(
    private readonly hooks: CollectionHooks = {},
    seed: T[] = [],
  ) {
    for (const item of seed) this.items.set(item.id, item);
  }

  async list(): Promise<T[]> {
    return [...this.items.values()];
  }

  async get(id: string): Promise<T | null> {
    return this.items.get(id) ?? null;
  }

  async put(item: T): Promise<void> {
    this.items.set(item.id, item);
    await this.hooks.onPut?.(item.id);
  }

  async putMany(items: T[]): Promise<void> {
    for (const item of items) {
      this.items.set(item.id, item);
      await this.hooks.onPut?.(item.id);
    }
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
    await this.hooks.onDelete?.(id);
  }

  async deleteRaw(id: string): Promise<void> {
    this.items.delete(id);
  }

  async clear(): Promise<void> {
    const ids = [...this.items.keys()];
    this.items.clear();
    for (const id of ids) await this.hooks.onDelete?.(id);
  }
}

class MemoryProfileStore implements ProfileStore {
  private profile: UserProfile;

  constructor(seed?: UserProfile) {
    this.profile = seed ?? createDefaultProfile();
  }

  async get(): Promise<UserProfile> {
    return this.profile;
  }

  async put(profile: UserProfile): Promise<void> {
    this.profile = profile;
  }
}

export interface MemoryStoreSeed {
  entries?: Entry[];
  medications?: Medication[];
  medicationEvents?: MedicationEvent[];
  warningSigns?: WarningSign[];
  assessments?: Assessment[];
  profile?: UserProfile;
}

function tombstoneHooks(
  tombstones: Collection<Tombstone>,
  collection: SyncCollection,
  now: () => number,
): CollectionHooks {
  return {
    onPut: (id) => tombstones.delete(tombstoneId(collection, id)),
    onDelete: (id) => tombstones.put(makeTombstone(collection, id, now())),
  };
}

/** Adaptador em memória: testes, pré-visualizações e fallback sem IndexedDB. */
export function createMemoryStore(seed: MemoryStoreSeed = {}, now = Date.now): AfetivoStore {
  const tombstones = new MemoryCollection<Tombstone>();
  const hooks = (collection: SyncCollection) => tombstoneHooks(tombstones, collection, now);
  return {
    entries: new MemoryCollection<Entry>(hooks('entries'), seed.entries ?? []),
    medications: new MemoryCollection<Medication>(hooks('medications'), seed.medications ?? []),
    medicationEvents: new MemoryCollection<MedicationEvent>(
      hooks('medicationEvents'),
      seed.medicationEvents ?? [],
    ),
    warningSigns: new MemoryCollection<WarningSign>(hooks('warningSigns'), seed.warningSigns ?? []),
    assessments: new MemoryCollection<Assessment>(hooks('assessments'), seed.assessments ?? []),
    profile: new MemoryProfileStore(seed.profile),
    tombstones,
  };
}
