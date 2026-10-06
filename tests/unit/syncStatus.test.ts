import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getSyncStatus,
  resetSyncStatus,
  setSyncStatus,
  subscribeSyncStatus,
} from '@/data/sync/status';

describe('sync status store', () => {
  beforeEach(() => resetSyncStatus());

  it('começa como never', () => {
    expect(getSyncStatus()).toEqual({ kind: 'never' });
  });

  it('guarda e notifica inscritos em setSyncStatus', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSyncStatus(listener);

    setSyncStatus({ kind: 'ok', at: 123, pushed: 2, merged: 1 });

    expect(getSyncStatus()).toEqual({ kind: 'ok', at: 123, pushed: 2, merged: 1 });
    expect(listener).toHaveBeenCalledTimes(1);

    setSyncStatus({ kind: 'error', at: 456, message: 'falhou' });
    expect(getSyncStatus()).toEqual({ kind: 'error', at: 456, message: 'falhou' });
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    setSyncStatus({ kind: 'never' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('resetSyncStatus volta para never sem derrubar os inscritos', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSyncStatus(listener);
    setSyncStatus({ kind: 'ok', at: 1, pushed: 0, merged: 0 });
    listener.mockClear();

    resetSyncStatus();
    expect(getSyncStatus()).toEqual({ kind: 'never' });
    expect(listener).not.toHaveBeenCalled();

    setSyncStatus({ kind: 'ok', at: 2, pushed: 1, merged: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('inscritos são independentes (só quem mudou é avisado)', () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = subscribeSyncStatus(a);
    const unsubB = subscribeSyncStatus(b);

    setSyncStatus({ kind: 'ok', at: 1, pushed: 1, merged: 0 });
    unsubA();
    setSyncStatus({ kind: 'error', at: 2, message: 'x' });

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
    unsubB();
  });
});
