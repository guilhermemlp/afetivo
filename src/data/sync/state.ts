import { initialSyncState, type SyncState } from './types';

export const SYNC_STATE_KEY = 'afetivo_sync_state_v1';

export interface SyncStateStore {
  get(): Promise<SyncState>;
  set(next: SyncState): Promise<void>;
}

function isSyncState(value: unknown): value is SyncState {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as Partial<SyncState>;
  return (
    typeof candidate.pushCursor === 'number' &&
    Number.isFinite(candidate.pushCursor) &&
    typeof candidate.pullCursor === 'number' &&
    Number.isFinite(candidate.pullCursor)
  );
}

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Estado em memória: testes e fallback sem localStorage. */
export function createMemorySyncState(initial: SyncState = initialSyncState()): SyncStateStore {
  let state = initial;
  return {
    async get() {
      return state;
    },
    async set(next) {
      state = next;
    },
  };
}

/**
 * Estado persistido no `localStorage` — sobrevive a reloads e offline.
 * Payload corrompido volta ao estado inicial (re-sincroniza do zero).
 */
export function createLocalSyncState(
  storage: KeyValueStorage | null = typeof localStorage === 'undefined' ? null : localStorage,
): SyncStateStore {
  return {
    async get() {
      if (!storage) return initialSyncState();
      try {
        const raw = storage.getItem(SYNC_STATE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        return isSyncState(parsed) ? parsed : initialSyncState();
      } catch {
        return initialSyncState();
      }
    },
    async set(next) {
      if (!storage) return;
      try {
        storage.setItem(SYNC_STATE_KEY, JSON.stringify(next));
      } catch {
        // Storage cheio/indisponível: cursores são otimização, não dado crítico.
      }
    },
  };
}
