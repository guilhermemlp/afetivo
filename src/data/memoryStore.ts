import type { Entry } from '@/core/entry';
import type { Medication, MedicationEvent } from '@/core/medication';
import { createDefaultProfile, type UserProfile } from '@/core/profile';
import type { Assessment, WarningSign } from '@/core/tracking';
import type { AfetivoStore, Collection, ProfileStore } from './store';

class MemoryCollection<T extends { id: string }> implements Collection<T> {
  private readonly items = new Map<string, T>();

  constructor(seed: T[] = []) {
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
  }

  async putMany(items: T[]): Promise<void> {
    for (const item of items) this.items.set(item.id, item);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async clear(): Promise<void> {
    this.items.clear();
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

/** Adaptador em memória: testes, pré-visualizações e fallback sem IndexedDB. */
export function createMemoryStore(seed: MemoryStoreSeed = {}): AfetivoStore {
  return {
    entries: new MemoryCollection(seed.entries ?? []),
    medications: new MemoryCollection(seed.medications ?? []),
    medicationEvents: new MemoryCollection(seed.medicationEvents ?? []),
    warningSigns: new MemoryCollection(seed.warningSigns ?? []),
    assessments: new MemoryCollection(seed.assessments ?? []),
    profile: new MemoryProfileStore(seed.profile),
  };
}
