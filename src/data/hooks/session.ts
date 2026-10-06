import { useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getAuthApi } from '@/data/auth';
import { getSyncStatus, subscribeSyncStatus, type SyncStatus } from '@/data/sync/status';

/** Status da última sincronização (observável; inicial em "never"). */
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribeSyncStatus, getSyncStatus, getSyncStatus);
}

/**
 * Sessão atual do Supabase (`null` em modo local ou sem login). Vive num
 * store externo porque o magic link muda a sessão fora do React (redirect);
 * a carga inicial lê `currentSession()` para refletir sessão persistida.
 */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot, getSessionSnapshot);
}

let session: Session | null = null;
let listening = false;
const sessionListeners = new Set<() => void>();

function getSessionSnapshot(): Session | null {
  return session;
}

function emitSession(next: Session | null): void {
  session = next;
  for (const listener of sessionListeners) listener();
}

function subscribeSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  if (!listening) {
    listening = true;
    const api = getAuthApi();
    if (api) {
      api.onAuthChange((next) => emitSession(next));
      void api.currentSession().then((current) => {
        // Não sobrescreve uma sessão mais nova já chega pelo listener.
        if (session === null) emitSession(current);
      });
    }
  }
  return () => sessionListeners.delete(listener);
}

/** Testes: força nova leitura no próximo hook. */
export function resetSessionStore(): void {
  session = null;
  listening = false;
}
