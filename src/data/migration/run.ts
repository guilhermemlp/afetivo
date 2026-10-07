import type { AfetivoStore } from '@/data/store';
import { migrateV1FromLocalStorage } from './localStorageSource';

/** Marcador de que a migração do v1 já rodou neste navegador. */
export const V1_MIGRATION_FLAG = 'afetivo_v1_migrated';

export type MigrationRun = 'already_done' | 'nothing' | 'migrated' | 'failed';

/**
 * Migra o `localStorage` do v1 para o IndexedDB local, uma única vez.
 * As chaves do v1 são preservadas (retentativa segura); falhas nunca
 * derrubam o boot — a próxima abordagem tenta de novo.
 */
export async function runV1MigrationIfNeeded(
  store: AfetivoStore,
  storage: Storage = window.localStorage,
): Promise<MigrationRun> {
  try {
    if (storage.getItem(V1_MIGRATION_FLAG) != null) return 'already_done';

    const outcome = migrateV1FromLocalStorage(storage);
    if (outcome == null) return 'nothing';

    if (outcome.entries.length > 0) await store.entries.putMany(outcome.entries);
    if (outcome.medicationEvents.length > 0) {
      await store.medicationEvents.putMany(outcome.medicationEvents);
    }
    if (outcome.medications.length > 0) await store.medications.putMany(outcome.medications);
    if (outcome.profile != null) {
      const current = await store.profile.get();
      // O perfil já preenchido tem precedência sobre o migrado.
      if (current?.displayName == null) await store.profile.put(outcome.profile);
    }

    storage.setItem(V1_MIGRATION_FLAG, String(Date.now()));
    return 'migrated';
  } catch {
    return 'failed';
  }
}
