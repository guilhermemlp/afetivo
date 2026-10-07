import { beforeEach, describe, expect, it } from 'vitest';
import { runV1MigrationIfNeeded, V1_MIGRATION_FLAG } from '@/data/migration/run';
import { createMemoryStore } from '@/data/memoryStore';

const V1_ENTRY = {
  id: 'legacy-1',
  date: '2025-01-05',
  time: '20:00',
  moodScore: -1,
  energyLevel: 2,
  anxietyLevel: 3,
  irritabilityLevel: 1,
  journalNotes: 'Dia difícil.',
};

beforeEach(() => window.localStorage.clear());

describe('runV1MigrationIfNeeded', () => {
  it('sem dados do v1 não migra nem marca a flag', async () => {
    const store = createMemoryStore();

    expect(await runV1MigrationIfNeeded(store)).toBe('nothing');
    expect(window.localStorage.getItem(V1_MIGRATION_FLAG)).toBeNull();
    expect(await store.entries.list()).toEqual([]);
  });

  it('migra entradas e perfil do v1 e preserva as chaves originais', async () => {
    window.localStorage.setItem('afetivo_entries_v2', JSON.stringify([V1_ENTRY]));
    window.localStorage.setItem(
      'afetivo_user_profile_v2',
      JSON.stringify({ name: 'Ana', notificationsEnabled: true }),
    );
    const store = createMemoryStore();

    expect(await runV1MigrationIfNeeded(store)).toBe('migrated');

    const entries = await store.entries.list();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe('legacy-1');
    expect(entries[0]?.journalNotes).toBe('Dia difícil.');
    expect((await store.profile.get())?.displayName).toBe('Ana');
    expect(window.localStorage.getItem(V1_MIGRATION_FLAG)).not.toBeNull();
    expect(window.localStorage.getItem('afetivo_entries_v2')).not.toBeNull();
  });

  it('a segunda chamada é um no-op e não duplica registros', async () => {
    window.localStorage.setItem('afetivo_entries_v2', JSON.stringify([V1_ENTRY]));
    const store = createMemoryStore();

    expect(await runV1MigrationIfNeeded(store)).toBe('migrated');
    expect(await runV1MigrationIfNeeded(store)).toBe('already_done');
    expect(await store.entries.list()).toHaveLength(1);
  });

  it('não sobrescreve um perfil que já tem nome', async () => {
    window.localStorage.setItem('afetivo_user_profile_v2', JSON.stringify({ name: 'Ana' }));
    const store = createMemoryStore();
    const current = await store.profile.get();
    await store.profile.put({ ...current, displayName: 'Já existia' });

    expect(await runV1MigrationIfNeeded(store)).toBe('migrated');
    expect((await store.profile.get())?.displayName).toBe('Já existia');
  });

  it('JSON corrompido não quebra o boot nem marca a flag', async () => {
    window.localStorage.setItem('afetivo_entries_v2', '{quebrado');
    const store = createMemoryStore();

    expect(await runV1MigrationIfNeeded(store)).toBe('nothing');
    expect(window.localStorage.getItem(V1_MIGRATION_FLAG)).toBeNull();
  });

  it('falha de persistência não marca a flag (retentativa no próximo boot)', async () => {
    window.localStorage.setItem('afetivo_entries_v2', JSON.stringify([V1_ENTRY]));
    const store = createMemoryStore();
    store.entries.putMany = () => Promise.reject(new Error('armazenamento cheio'));

    expect(await runV1MigrationIfNeeded(store)).toBe('failed');
    expect(window.localStorage.getItem(V1_MIGRATION_FLAG)).toBeNull();
  });
});
