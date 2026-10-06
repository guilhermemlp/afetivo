import type { Entry } from '@/core/entry';
import type { Medication, MedicationEvent } from '@/core/medication';
import type { UserProfile } from '@/core/profile';
import type { Assessment, WarningSign } from '@/core/tracking';
import type { Tombstone } from './sync/types';

/**
 * Contrato de persistência. A interface conhece a UI, nunca o inverso —
 * trocar IndexedDB por uma API remota não altera nenhum componente.
 */
export interface Collection<T extends { id: string }> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  put(item: T): Promise<void>;
  putMany(items: T[]): Promise<void>;
  /** Exclusão local: remove o item e grava um tombstone para o sync. */
  delete(id: string): Promise<void>;
  /** Exclusão vinda do remoto: o servidor já sabe, não grava tombstone. */
  deleteRaw(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ProfileStore {
  get(): Promise<UserProfile>;
  put(profile: UserProfile): Promise<void>;
}

export interface AfetivoStore {
  entries: Collection<Entry>;
  medications: Collection<Medication>;
  medicationEvents: Collection<MedicationEvent>;
  warningSigns: Collection<WarningSign>;
  assessments: Collection<Assessment>;
  profile: ProfileStore;
  /** Exclusões locais pendentes de envio. */
  tombstones: Collection<Tombstone>;
}
