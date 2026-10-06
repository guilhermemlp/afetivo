import { beforeEach, describe, expect, it } from 'vitest';
import { createBlankEntry, withUpdates } from '@/core/entry';
import { createDefaultProfile } from '@/core/profile';
import type { SyncResult } from '@/data/sync/engine';
import { syncOnce } from '@/data/sync/engine';
import { createMemoryStore } from '@/data/memoryStore';
import { SyncError } from '@/data/remote/types';
import type { AfetivoStore } from '@/data/store';
import { createMemorySyncState, type SyncStateStore } from '@/data/sync/state';
import { FakeRemote } from '../helpers/fakeRemote';

const BASE = Date.UTC(2026, 9, 6, 12, 0, 0);
const CURSOR_INITIAL = { pushCursor: 0, pullCursor: 0 };

let now = BASE;
let remote: FakeRemote;

interface Device {
  store: AfetivoStore;
  state: SyncStateStore;
  sync: () => Promise<SyncResult>;
}

function makeDevice(): Device {
  const store = createMemoryStore({ profile: createDefaultProfile(BASE) }, () => now);
  const state = createMemorySyncState();
  return {
    store,
    state,
    sync: () => syncOnce({ store, remote, state, now: () => now }),
  };
}

beforeEach(() => {
  now = BASE;
  remote = new FakeRemote();
});

describe('syncOnce', () => {
  it('primeira sync envia tudo, baixa sem duplicar e avança cursores', async () => {
    const device = makeDevice();
    const entry = createBlankEntry(new Date(BASE));
    await device.store.entries.put(entry);
    now += 10_000;

    const result = await device.sync();

    expect(result.pushed).toBe(2); // registro + perfil
    expect(result.merged).toBe(0);
    expect(remote.get('entries', entry.id)?.data).toEqual(entry);
    expect(remote.get('profile', 'local')?.data).not.toBeNull();
    expect(await device.store.entries.list()).toHaveLength(1);
    expect(await device.state.get()).toEqual({ pushCursor: now - 1000, pullCursor: now - 1000 });
  });

  it('sync repetida sem mudanças não reenvia nada', async () => {
    const device = makeDevice();
    await device.store.entries.put(createBlankEntry(new Date(BASE)));
    now += 10_000;
    await device.sync();
    const calls = remote.pushCalls;
    const rows = remote.pushedRows;

    now += 60_000;
    const result = await device.sync();

    expect(result.pushed).toBe(0);
    expect(result.merged).toBe(0);
    expect(result.skipped).toBe(0);
    expect(remote.pushCalls).toBe(calls);
    expect(remote.pushedRows).toBe(rows);
  });

  it('registro criado em A aparece em B', async () => {
    const a = makeDevice();
    const b = makeDevice();
    const entry = createBlankEntry(new Date(BASE));
    await a.store.entries.put(entry);
    now += 10_000;
    await a.sync();

    now += 10_000;
    const result = await b.sync();

    expect(result.merged).toBe(1);
    expect(await b.store.entries.get(entry.id)).toEqual(entry);
  });

  it('dado mais antigo local cede para a versão mais nova do servidor (LWW)', async () => {
    const a = makeDevice();
    const b = makeDevice();
    const entry = createBlankEntry(new Date(BASE));
    await a.store.entries.put(entry);
    now += 10_000;
    await a.sync();
    await b.sync();

    // A edita primeiro (versão que ficará para trás)...
    now += 5_000;
    await a.store.entries.put(withUpdates(entry, { journalNotes: 'de A' }, now));

    // ...depois B edita por cima e o servidor guarda a mais nova.
    now += 60_000;
    await b.store.entries.put(withUpdates(entry, { journalNotes: 'de B' }, now));
    await b.sync();

    now += 60_000;
    await a.sync();

    expect((await a.store.entries.get(entry.id))?.journalNotes).toBe('de B');
    expect(remote.get('entries', entry.id)?.data).toMatchObject({ journalNotes: 'de B' });
  });

  it('exclusão local vira tombstone e apaga no outro dispositivo', async () => {
    const a = makeDevice();
    const b = makeDevice();
    const entry = createBlankEntry(new Date(BASE));
    await a.store.entries.put(entry);
    now += 10_000;
    await a.sync();
    await b.sync();

    now += 30_000;
    await a.store.entries.delete(entry.id);
    const result = await a.sync();

    expect(result.tombstonesPushed).toBe(1);
    expect(await a.store.tombstones.list()).toEqual([]);
    expect(remote.get('entries', entry.id)).toMatchObject({ deletedAt: now, data: null });

    now += 30_000;
    const bResult = await b.sync();

    expect(bResult.deleted).toBe(1);
    expect(await b.store.entries.get(entry.id)).toBeNull();
    expect(await b.store.tombstones.list()).toEqual([]); // delete remoto é "cru"
  });

  it('exclusão remota mais nova apaga localmente sem deixar tombstone', async () => {
    const a = makeDevice();
    const b = makeDevice();
    const entry = createBlankEntry(new Date(BASE));
    await a.store.entries.put(entry);
    now += 10_000;
    await a.sync();
    await b.sync();

    now += 30_000;
    await b.store.entries.delete(entry.id);
    await b.sync();

    now += 30_000;
    const result = await a.sync();

    expect(result.deleted).toBe(1);
    expect(await a.store.entries.get(entry.id)).toBeNull();
    expect(await a.store.tombstones.list()).toEqual([]);
  });

  it('edição local mais nova sobrevive a exclusão remota mais antiga', async () => {
    const a = makeDevice();
    const b = makeDevice();
    const entry = createBlankEntry(new Date(BASE));
    await a.store.entries.put(entry);
    now += 10_000;
    await a.sync();
    await b.sync();

    now += 30_000;
    await b.store.entries.delete(entry.id);
    await b.sync();

    now += 30_000;
    const edited = withUpdates(entry, { journalNotes: 'escrito durante a queda' }, now);
    await a.store.entries.put(edited);
    await a.sync();

    expect(await a.store.entries.get(entry.id)).toEqual(edited);
    expect(remote.get('entries', entry.id)?.data).toMatchObject({
      journalNotes: 'escrito durante a queda',
    });

    now += 30_000;
    await b.sync();
    expect(await b.store.entries.get(entry.id)).toMatchObject({
      journalNotes: 'escrito durante a queda',
    });
  });

  it('exclusão feita durante o pull respeita o tombstone local (2 saltos)', async () => {
    const a = makeDevice();
    const b = makeDevice();
    const entry = createBlankEntry(new Date(BASE));
    await a.store.entries.put(entry);
    now += 10_000;
    await a.sync();
    await b.sync();

    // B edita para a linha remota estar além do cursor de A.
    now += 30_000;
    await b.store.entries.put(withUpdates(entry, { journalNotes: 'de B' }, now));
    await b.sync();

    // A UI de A exclui o registro enquanto o pull ainda busca linhas.
    now += 30_000;
    remote.beforePull = (collection) => {
      if (collection === 'entries') return a.store.entries.delete(entry.id);
      return undefined;
    };
    const result = await a.sync();
    remote.beforePull = null;

    expect(result.merged).toBe(0);
    expect(await a.store.entries.get(entry.id)).toBeNull();
    expect(await a.store.tombstones.list()).toHaveLength(1); // segue pendente

    now += 30_000;
    const next = await a.sync();

    expect(next.tombstonesPushed).toBe(1);
    expect(await a.store.tombstones.list()).toEqual([]);
    expect(remote.get('entries', entry.id)?.deletedAt).toBe(BASE + 70_000);
  });

  it('falha de push propaga e não avança cursores', async () => {
    const device = makeDevice();
    const entry = createBlankEntry(new Date(BASE));
    await device.store.entries.put(entry);
    now += 10_000;
    remote.failNextPush = new SyncError('network', 'offline');

    await expect(device.sync()).rejects.toMatchObject({ kind: 'network' });

    expect(await device.state.get()).toEqual(CURSOR_INITIAL);
    expect(remote.get('entries', entry.id)).toBeUndefined();
  });

  it('falha de pull mantém cursores mesmo com o push concluído', async () => {
    const device = makeDevice();
    const entry = createBlankEntry(new Date(BASE));
    await device.store.entries.put(entry);
    now += 10_000;
    remote.failNextPull = new SyncError('network', 'offline');

    await expect(device.sync()).rejects.toMatchObject({ kind: 'network' });

    expect(remote.get('entries', entry.id)).toBeDefined(); // push aconteceu
    expect(await device.state.get()).toEqual(CURSOR_INITIAL); // pull não
  });

  it('payload remoto inválido é pulado sem derrubar o resto', async () => {
    const device = makeDevice();
    const entry = createBlankEntry(new Date(BASE));
    await device.store.entries.put(entry);
    remote.seed('entries', {
      id: 'quebrado',
      updatedAt: BASE + 5_000,
      deletedAt: null,
      data: { id: 'quebrado', semOsCamposCertos: true },
    });
    now += 10_000;

    const result = await device.sync();

    expect(result.skipped).toBe(1);
    expect(await device.store.entries.get('quebrado')).toBeNull();
    expect(await device.store.entries.get(entry.id)).toEqual(entry);
  });

  it('sincroniza o perfil preenchido localmente', async () => {
    const a = makeDevice();
    const b = makeDevice();
    now += 10_000;
    const profile = await a.store.profile.get();
    await a.store.profile.put({ ...profile, displayName: 'Ana', updatedAt: now });
    await a.sync();

    now += 10_000;
    await b.sync();

    expect((await b.store.profile.get()).displayName).toBe('Ana');
  });
});
