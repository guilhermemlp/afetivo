import { SyncError, type RemoteClient } from '@/data/remote/types';
import type { AfetivoStore } from '@/data/store';
import { syncOnce, type SyncResult } from './engine';
import { createLocalSyncState, type SyncStateStore } from './state';

export interface SyncRuntimeOptions {
  store: AfetivoStore;
  /** `null` = backend não configurado: o runtime fica inerte. */
  remote: RemoteClient | null;
  state?: SyncStateStore;
  /** Janela de debounce para mudanças locais. */
  debounceMs?: number;
  /** Verificação de sessão antes de cada execução (silencia sem login). */
  getSession?: () => Promise<unknown | null>;
  onSync?: (result: SyncResult) => void;
  onError?: (error: SyncError) => void;
  windowRef?: Pick<Window, 'addEventListener' | 'removeEventListener'> | null;
  now?: () => number;
}

const DEFAULT_DEBOUNCE_MS = 3000;

interface RuntimeHandle {
  schedule: (delayMs?: number) => void;
  stop: () => void;
}

let handle: RuntimeHandle | null = null;

function createHandle(options: SyncRuntimeOptions): RuntimeHandle {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const state = options.state ?? createLocalSyncState();
  const windowRef =
    options.windowRef === undefined
      ? typeof window === 'undefined'
        ? null
        : window
      : options.windowRef;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let pending = false;
  let stopped = false;

  async function run(): Promise<void> {
    if (stopped || !options.remote) return;
    if (running) {
      pending = true;
      return;
    }
    running = true;
    try {
      if (options.getSession) {
        const session = await options.getSession();
        // Sem sessão o sync simplesmente não roda — nunca é erro.
        if (!session) return;
      }
      const result = await syncOnce({
        store: options.store,
        remote: options.remote,
        state,
        now: options.now,
      });
      options.onSync?.(result);
    } catch (error) {
      const syncError =
        error instanceof SyncError ? error : new SyncError('unknown', String(error));
      // Offline e sessão expirada são esperados; só o inesperado vaza.
      console.warn(`[afetivo/sync:${syncError.kind}] ${syncError.message}`);
      options.onError?.(syncError);
    } finally {
      running = false;
      if (pending && !stopped) {
        pending = false;
        void run();
      }
    }
  }

  function schedule(delayMs = debounceMs): void {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void run();
    }, delayMs);
  }

  const onWake = () => schedule(0);
  windowRef?.addEventListener('online', onWake);
  windowRef?.addEventListener('focus', onWake);

  return {
    schedule,
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      windowRef?.removeEventListener('online', onWake);
      windowRef?.removeEventListener('focus', onWake);
    },
  };
}

/**
 * Sobe o runtime de sync e registra os gatilhos:
 * boot, `online`, `focus` e debounce de mudanças locais via
 * [`notifyLocalChange`]{@link notifyLocalChange}.
 *
 * Sem env/sessão o runtime fica inerte — o app continua 100% local.
 * Retorna a função que derruba os listeners e timers.
 */
export function startSyncRuntime(options: SyncRuntimeOptions): () => void {
  stopSyncRuntime();
  // Sem remote (env ausente) o runtime é inerte: o app segue 100% local.
  if (!options.remote) return () => {};
  handle = createHandle(options);
  handle.schedule(0);
  const active = handle;
  return () => {
    if (handle === active) stopSyncRuntime();
  };
}

export function stopSyncRuntime(): void {
  handle?.stop();
  handle = null;
}

/** Chamado pela camada de escrita após cada mutação local. */
export function notifyLocalChange(): void {
  handle?.schedule();
}
