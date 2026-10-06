import { describe, expect, it } from 'vitest';
import { createBlankEntry } from '@/core/entry';
import { createBlankMedication } from '@/core/medication';
import { createMemoryStore } from '@/data/memoryStore';

const NOW = 1_770_000_000_000;

function makeStore() {
  return createMemoryStore({}, () => NOW);
}

describe('tombstones na store em memória', () => {
  it('delete local grava um tombstone estável', async () => {
    const store = makeStore();
    const entry = createBlankEntry(new Date(NOW));
    await store.entries.put(entry);

    await store.entries.delete(entry.id);

    const tombstones = await store.tombstones.list();
    expect(tombstones).toHaveLength(1);
    expect(tombstones[0]).toEqual({
      id: `entries:${entry.id}`,
      collection: 'entries',
      targetId: entry.id,
      deletedAt: NOW,
    });
    expect(await store.entries.get(entry.id)).toBeNull();
  });

  it('deleteRaw remove sem deixar rastro', async () => {
    const store = makeStore();
    const entry = createBlankEntry(new Date(NOW));
    await store.entries.put(entry);

    await store.entries.deleteRaw(entry.id);

    expect(await store.entries.get(entry.id)).toBeNull();
    expect(await store.tombstones.list()).toEqual([]);
  });

  it('put remove o tombstone do mesmo item (reativação)', async () => {
    const store = makeStore();
    const entry = createBlankEntry(new Date(NOW));
    await store.entries.put(entry);
    await store.entries.delete(entry.id);
    expect(await store.tombstones.list()).toHaveLength(1);

    await store.entries.put({ ...entry, updatedAt: NOW + 1 });

    expect(await store.tombstones.list()).toEqual([]);
    expect(await store.entries.get(entry.id)).not.toBeNull();
  });

  it('putMany remove os tombstones correspondentes', async () => {
    const store = makeStore();
    const a = createBlankEntry(new Date(NOW));
    const b = createBlankEntry(new Date(NOW));
    await store.entries.putMany([a, b]);
    await store.entries.delete(a.id);
    await store.entries.delete(b.id);
    expect(await store.tombstones.list()).toHaveLength(2);

    await store.entries.putMany([a, b]);

    expect(await store.tombstones.list()).toEqual([]);
  });

  it('clear propaga a exclusão de todos os itens', async () => {
    const store = makeStore();
    const med = createBlankMedication('Lítio', NOW);
    const other = createBlankMedication('Sertralina', NOW);
    await store.medications.putMany([med, other]);

    await store.medications.clear();

    expect(await store.medications.list()).toEqual([]);
    const tombstones = await store.tombstones.list();
    expect(tombstones.map((tombstone) => tombstone.targetId).sort()).toEqual(
      [med.id, other.id].sort(),
    );
    expect(tombstones.every((tombstone) => tombstone.collection === 'medications')).toBe(true);
  });

  it('mantém coleções isoladas (delete em entries não vaza)', async () => {
    const store = makeStore();
    const entry = createBlankEntry(new Date(NOW));
    const med = createBlankMedication('Lítio', NOW);
    await store.entries.put(entry);
    await store.medications.put(med);

    await store.entries.delete(entry.id);

    const tombstones = await store.tombstones.list();
    expect(tombstones).toHaveLength(1);
    expect(tombstones[0]?.collection).toBe('entries');
    expect(await store.medications.get(med.id)).not.toBeNull();
  });

  it('apagar a própria coleção de tombstones não gera regressão', async () => {
    const store = makeStore();
    const entry = createBlankEntry(new Date(NOW));
    await store.entries.put(entry);
    await store.entries.delete(entry.id);

    await store.tombstones.clear();

    expect(await store.tombstones.list()).toEqual([]);
  });

  it('tombstone é upsert pelo id (repetir o delete não duplica)', async () => {
    const store = makeStore();
    const entry = createBlankEntry(new Date(NOW));
    await store.entries.put(entry);

    await store.entries.delete(entry.id);
    await store.entries.delete(entry.id);

    expect(await store.tombstones.list()).toHaveLength(1);
  });
});
