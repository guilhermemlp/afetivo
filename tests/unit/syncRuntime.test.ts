import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBlankEntry } from '@/core/entry';
import { createDefaultProfile } from '@/core/profile';
import { createMemoryStore } from '@/data/memoryStore';
import { SyncError } from '@/data/remote/types';
import type { SyncResult } from '@/data/sync/engine';
import { notifyLocalChange, startSyncRuntime, stopSyncRuntime } from '@/data/sync/runtime';
import { createMemorySyncState } from '@/data/sync/state';
import { FakeRemote } from '../helpers/fakeRemote';

function flush(ms = 30): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitFor(predicate: () => boolean, timeout = 800): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      if (predicate()) resolve();
      else if (Date.now() - started > timeout) reject(new Error('Tempo esgotado esperando sync.'));
      else setTimeout(check, 5);
    };
    check();
  });
}

describe('startSyncRuntime', () => {
  let remote: FakeRemote;
  let synced: SyncResult[];

  beforeEach(() => {
    remote = new FakeRemote();
    synced = [];
  });

  afterEach(() => stopSyncRuntime());

  function start(extra: Record<string, unknown> = {}) {
    return startSyncRuntime({
      store: createMemoryStore({ profile: createDefaultProfile(0) }),
      remote,
      state: createMemorySyncState(),
      debounceMs: 30,
      getSession: async () => ({ user: { id: 'user-123' } }),
      onSync: (result) => synced.push(result),
      ...extra,
    });
  }

  it('sem remote fica inerte (modo local puro)', async () => {
    start({ remote: null });
    notifyLocalChange();
    await flush(60);

    expect(remote.pushCalls).toBe(0);
    expect(synced).toHaveLength(0);
  });

  it('sincroniza no boot e agrupa mudanças locais em um único run', async () => {
    const store = createMemoryStore({ profile: createDefaultProfile(0) });
    await store.entries.put(createBlankEntry(new Date(1_000_000)));
    start({ store });

    await waitFor(() => synced.length >= 1);
    expect(synced[0]?.pushed).toBe(1); // só o registro (perfil com updatedAt 0 não reenvia)

    for (let index = 0; index < 5; index += 1) notifyLocalChange();
    await flush(15);
    expect(synced).toHaveLength(1); // ainda dentro do debounce

    await waitFor(() => synced.length >= 2);
    expect(synced).toHaveLength(2); // as 5 notificações viraram 1 run
  });

  it('sem sessão não executa (fica silencioso)', async () => {
    start({ getSession: async () => null });
    await flush(80);

    expect(remote.pushCalls).toBe(0);
    expect(synced).toHaveLength(0);
  });

  it('evento online dispara sync imediato', async () => {
    start();
    await waitFor(() => synced.length >= 1);

    window.dispatchEvent(new Event('online'));

    await waitFor(() => synced.length >= 2);
    expect(synced).toHaveLength(2);
  });

  it('classifica e reporta erro de rede sem derrubar o app', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errors: SyncError[] = [];
    const store = createMemoryStore({ profile: createDefaultProfile(0) });
    await store.entries.put(createBlankEntry(new Date(1_000_000)));
    remote.failNextPush = new SyncError('network', 'offline');

    start({ store, onError: (error: SyncError) => errors.push(error) });

    await waitFor(() => errors.length >= 1);
    expect(errors[0]?.kind).toBe('network');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('sync:network'));
  });

  it('stop derruba listeners e timers', async () => {
    const stop = start();
    await waitFor(() => synced.length >= 1);

    stop();
    window.dispatchEvent(new Event('online'));
    notifyLocalChange();
    await flush(80);

    expect(synced).toHaveLength(1);
  });
});
