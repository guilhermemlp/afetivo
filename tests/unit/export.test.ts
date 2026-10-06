import { describe, expect, it } from 'vitest';
import { createBlankEntry } from '@/core/entry';
import { createBlankMedication, createMedicationEvent } from '@/core/medication';
import { createMemoryStore } from '@/data/memoryStore';
import { EXPORT_FORMAT, EXPORT_VERSION, collectExport, exportFilename } from '@/data/export';

function seedStore() {
  const entry = createBlankEntry(new Date(2026, 9, 6, 9));
  const medication = createBlankMedication('Lítio');
  const event = createMedicationEvent({
    medicationId: medication.id,
    medicationName: medication.name,
    kind: 'intake',
  });
  return createMemoryStore({
    entries: [entry],
    medications: [medication],
    medicationEvents: [event],
  });
}

describe('collectExport', () => {
  it('monta o backup com contagens e todos os registros', async () => {
    const now = new Date(2026, 9, 6, 12, 30).getTime();
    const payload = await collectExport(seedStore(), now);

    expect(payload.format).toBe(EXPORT_FORMAT);
    expect(payload.version).toBe(EXPORT_VERSION);
    expect(payload.exportedAt).toBe(new Date(now).toISOString());
    expect(payload.counts).toEqual({
      entries: 1,
      medications: 1,
      medicationEvents: 1,
      warningSigns: 0,
      assessments: 0,
    });
    expect(payload.entries).toHaveLength(1);
    expect(payload.medications[0]?.name).toBe('Lítio');
    expect(payload.medicationEvents[0]?.kind).toBe('intake');
    expect(payload.warningSigns).toEqual([]);
    expect(payload.assessments).toEqual([]);
    expect(payload.profile?.id).toBe('local');
  });

  it('começa vazio quando a loja não tem nada', async () => {
    const payload = await collectExport(createMemoryStore(), 0);

    expect(payload.counts).toEqual({
      entries: 0,
      medications: 0,
      medicationEvents: 0,
      warningSigns: 0,
      assessments: 0,
    });
    expect(payload.entries).toEqual([]);
    expect(payload.profile?.displayName).toBeNull();
  });

  it('é JSON-serializável sem circularidade', async () => {
    const payload = await collectExport(seedStore());

    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  });
});

describe('exportFilename', () => {
  it('usa a data local no padrão afetivo-backup-YYYY-MM-DD.json', () => {
    expect(exportFilename(new Date(2026, 0, 2, 1, 2))).toBe('afetivo-backup-2026-01-02.json');
  });

  it('zero-padded para meses e dias de um dígito', () => {
    expect(exportFilename(new Date(2026, 8, 5))).toBe('afetivo-backup-2026-09-05.json');
  });
});
