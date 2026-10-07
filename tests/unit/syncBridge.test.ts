import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { invalidateAfterSync } from '@/data/sync/bridge';
import type { SyncResult } from '@/data/sync/engine';

function makeResult(overrides: Partial<SyncResult> = {}): SyncResult {
  return { pushed: 0, tombstonesPushed: 0, merged: 0, deleted: 0, skipped: 0, ...overrides };
}

describe('invalidateAfterSync', () => {
  it('invalida as queries quando o pull aplicou mudanças remotas', () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateAfterSync(queryClient, makeResult({ merged: 3 }));

    expect(spy).toHaveBeenCalledOnce();
  });

  it('invalida quando o pull aplicou exclusões remotas', () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateAfterSync(queryClient, makeResult({ deleted: 1 }));

    expect(spy).toHaveBeenCalledOnce();
  });

  it('não invalida quando a sync só enviou alterações locais', () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateAfterSync(queryClient, makeResult({ pushed: 2, tombstonesPushed: 1 }));

    expect(spy).not.toHaveBeenCalled();
  });

  it('não invalida quando nada mudou', () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateAfterSync(queryClient, makeResult());

    expect(spy).not.toHaveBeenCalled();
  });
});
