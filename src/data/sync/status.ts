/**
 * Último estado de sincronização da sessão, observável pela UI de Ajustes.
 * O runtime de sync continua desacoplado — aqui só registramos o resultado
 * informado pelos callbacks `onSync`/`onError`.
 */
export type SyncStatus =
  | { kind: 'never' }
  | { kind: 'ok'; at: number; pushed: number; merged: number }
  | { kind: 'error'; at: number; message: string };

let current: SyncStatus = { kind: 'never' };
const listeners = new Set<() => void>();

export function setSyncStatus(next: SyncStatus): void {
  current = next;
  for (const listener of listeners) listener();
}

export function getSyncStatus(): SyncStatus {
  return current;
}

export function subscribeSyncStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Testes: volta ao estado inicial. */
export function resetSyncStatus(): void {
  current = { kind: 'never' };
}
