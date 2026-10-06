import { describe, expect, it } from 'vitest';
import { createBlankEntry } from '@/core/entry';
import { createBlankMedication } from '@/core/medication';
import { createMemoryStore } from '@/data/memoryStore';

describe('createMemoryStore', () => {
  it('começa vazio com perfil padrão sem nome', async () => {
    const store = createMemoryStore();

    expect(await store.entries.list()).toEqual([]);
    expect(await store.medications.list()).toEqual([]);

    const profile = await store.profile.get();
    expect(profile.id).toBe('local');
    expect(profile.displayName).toBeNull();
    expect(profile.remindersOptIn).toBe(false);
  });

  it('persiste e recupera registros por id', async () => {
    const store = createMemoryStore();
    const entry = createBlankEntry(new Date(2026, 9, 6, 9));

    await store.entries.put(entry);

    expect(await store.entries.get(entry.id)).toEqual(entry);
    expect(await store.entries.get('inexistente')).toBeNull();
    expect(await store.entries.list()).toHaveLength(1);
  });

  it('faz putMany, delete e clear', async () => {
    const store = createMemoryStore();
    const a = createBlankEntry(new Date(2026, 9, 5, 9));
    const b = createBlankEntry(new Date(2026, 9, 6, 9));

    await store.entries.putMany([a, b]);
    expect(await store.entries.list()).toHaveLength(2);

    await store.entries.delete(a.id);
    expect(await store.entries.get(a.id)).toBeNull();
    expect(await store.entries.list()).toHaveLength(1);

    await store.entries.clear();
    expect(await store.entries.list()).toEqual([]);
  });

  it('sobrescreve no put (upsert) sem duplicar', async () => {
    const store = createMemoryStore();
    const med = createBlankMedication('Lítio');
    const updated = { ...med, name: 'Novo nome' };

    await store.medications.put(med);
    await store.medications.put(updated);

    const list = await store.medications.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe('Novo nome');
  });

  it('mantém isoladas as coleções', async () => {
    const store = createMemoryStore();
    await store.entries.put(createBlankEntry());
    await store.medications.put(createBlankMedication('Sertralina'));

    expect(await store.entries.list()).toHaveLength(1);
    expect(await store.medicationEvents.list()).toEqual([]);
    expect(await store.warningSigns.list()).toEqual([]);
    expect(await store.assessments.list()).toEqual([]);
  });

  it('aceita seed e persiste alterações de perfil', async () => {
    const store = createMemoryStore();
    const profile = await store.profile.get();

    await store.profile.put({ ...profile, displayName: 'Ana', updatedAt: 123 });

    const reloaded = await store.profile.get();
    expect(reloaded.displayName).toBe('Ana');
    expect(reloaded.updatedAt).toBe(123);
  });
});
