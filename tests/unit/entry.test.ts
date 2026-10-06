import { describe, expect, it } from 'vitest';
import { createBlankEntry, entrySchema, parseEntry, withUpdates } from '@/core/entry';

describe('createBlankEntry', () => {
  it('cria um registro válido sem nenhuma resposta obrigatória', () => {
    const entry = createBlankEntry(new Date(2026, 9, 6, 14, 30));

    expect(entry.schemaVersion).toBe(4);
    expect(entry.date).toBe('2026-10-06');
    expect(entry.time).toBe('14:30');
    expect(entry.recordKind).toBe('moment');
    expect(entry.moodScale).toBe('valence');
    expect(entry.moodScore).toBeNull();
    expect(entry.activationLevel).toBeNull();
    expect(entry.compulsion).toBeNull();
    expect(entry.tags).toEqual([]);
    expect(entry.impulses).toEqual([]);
    expect(entry.openedSections).toEqual([]);
    expect(entry.journalNotes).toBe('');
    expect(entry.isDemo).toBe(false);
    expect(entry.createdAt).toBe(entry.updatedAt);
  });

  it('preenche todos os campos de métricas como null (ausente ≠ 0)', () => {
    const { metrics } = createBlankEntry();
    expect(metrics.anxiety).toBeNull();
    expect(metrics.sleepHours).toBeNull();
    expect(metrics.energy).toBeNull();
    expect(metrics.impulsiveSpending).toBeNull();
  });
});

describe('entrySchema', () => {
  it('rejeita datas e escalas inválidas', () => {
    const base = createBlankEntry();
    expect(() => parseEntry({ ...base, date: '2026-02-30' })).toThrow();
    expect(() => parseEntry({ ...base, time: '25:00' })).toThrow();
    expect(() => parseEntry({ ...base, moodScore: 4 })).toThrow();
    expect(() => parseEntry({ ...base, activationLevel: 6 })).toThrow();
    expect(() => parseEntry({ ...base, metrics: { ...base.metrics, anxiety: 11 } })).toThrow();
    expect(() => parseEntry({ ...base, schemaVersion: 3 })).toThrow();
  });

  it('rejeita tags e seções desconhecidas', () => {
    const base = createBlankEntry();
    expect(() => parseEntry({ ...base, tags: [{ kind: 'inexistente', label: 'x' }] })).toThrow();
    expect(() => parseEntry({ ...base, openedSections: ['unknown'] })).toThrow();
  });

  it('aceita registros da escala legada', () => {
    const base = createBlankEntry();
    const legacy = parseEntry({ ...base, moodScale: 'legacy', moodScore: -2 });
    expect(legacy.moodScale).toBe('legacy');
    expect(legacy.moodScore).toBe(-2);
  });
});

describe('withUpdates', () => {
  it('atualiza campos e avança updatedAt preservando o id', () => {
    const entry = createBlankEntry(new Date(2026, 9, 6, 10, 0));
    const updated = withUpdates(entry, { moodScore: 1 }, entry.updatedAt + 1000);

    expect(updated.id).toBe(entry.id);
    expect(updated.moodScore).toBe(1);
    expect(updated.updatedAt).toBe(entry.updatedAt + 1000);
    expect(updated.createdAt).toBe(entry.createdAt);
  });
});

describe('entrySchema como validador de saída', () => {
  it('descarta chaves desconhecidas em vez de propagá-las', () => {
    const base = createBlankEntry();
    const parsed = entrySchema.parse({ ...base, campoAntigoDoV1: 'x' });
    expect('campoAntigoDoV1' in parsed).toBe(false);
  });
});
