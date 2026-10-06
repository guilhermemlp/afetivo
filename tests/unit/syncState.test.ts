import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalSyncState, createMemorySyncState, SYNC_STATE_KEY } from '@/data/sync/state';

const STATE = { pushCursor: 1_770_000_000_000, pullCursor: 1_769_999_999_000 };

describe('createMemorySyncState', () => {
  it('começa zerado e guarda o último valor', async () => {
    const state = createMemorySyncState();

    expect(await state.get()).toEqual({ pushCursor: 0, pullCursor: 0 });

    await state.set(STATE);
    expect(await state.get()).toEqual(STATE);
  });

  it('aceita estado inicial personalizado', async () => {
    const state = createMemorySyncState(STATE);
    expect(await state.get()).toEqual(STATE);
  });
});

describe('createLocalSyncState', () => {
  beforeEach(() => localStorage.removeItem(SYNC_STATE_KEY));

  it('persiste cursores na chave canônica e sobrevive a nova instância', async () => {
    const state = createLocalSyncState();
    expect(await state.get()).toEqual({ pushCursor: 0, pullCursor: 0 });

    await state.set(STATE);

    expect(localStorage.getItem(SYNC_STATE_KEY)).toBe(JSON.stringify(STATE));
    expect(await createLocalSyncState().get()).toEqual(STATE);
  });

  it('payload corrompido volta ao estado inicial', async () => {
    localStorage.setItem(SYNC_STATE_KEY, '{nao-e-json');
    expect(await createLocalSyncState().get()).toEqual({ pushCursor: 0, pullCursor: 0 });

    localStorage.setItem(SYNC_STATE_KEY, JSON.stringify({ pushCursor: 'x' }));
    expect(await createLocalSyncState().get()).toEqual({ pushCursor: 0, pullCursor: 0 });
  });

  it('sem storage disponível segue funcional em memória', async () => {
    const state = createLocalSyncState(null);

    await state.set(STATE);

    expect(await state.get()).toEqual({ pushCursor: 0, pullCursor: 0 });
  });

  it('storage que lança erro no set não derruba o sync', async () => {
    const state = createLocalSyncState({
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });

    await expect(state.set(STATE)).resolves.toBeUndefined();
    expect(await state.get()).toEqual({ pushCursor: 0, pullCursor: 0 });
  });
});
