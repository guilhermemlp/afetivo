import { describe, expect, it } from 'vitest';
import {
  dailyIntakes,
  dailySeries,
  monthMatrix,
  periodStats,
  simpleCorrelations,
  topTags,
} from '@/core/analysis';
import { addDays, dateRange, localDate } from '@/core/dates';
import { createBlankEntry, impulseSchema, withUpdates, type Entry } from '@/core/entry';
import { createMedicationEvent } from '@/core/medication';

describe('dailySeries', () => {
  it('preenche lacunas com null e nunca infere valor', () => {
    const now = new Date(2026, 9, 10, 12, 0);
    const base = new Date(2026, 9, 8, 12, 0).getTime();
    const day1 = withUpdates(createBlankEntry(new Date(base)), { moodScore: -2 }, 1);
    const day1b = withUpdates(createBlankEntry(new Date(base + 7_200_000)), { moodScore: 0 }, 2);
    const day3 = withUpdates(createBlankEntry(new Date(base + 172_800_000)), { moodScore: 3 }, 3);

    const range = dateRange(7, now);
    const points = dailySeries([day1, day1b, day3], range);

    const byDate = new Map(points.map((point) => [point.date, point]));
    expect(byDate.get('2026-10-08')).toMatchObject({
      moodAvg: -1,
      entryCount: 2,
      moodResponses: 2,
    });
    expect(byDate.get('2026-10-09')).toMatchObject({ moodAvg: null, entryCount: 0 });
    expect(byDate.get('2026-10-10')).toMatchObject({ moodAvg: 3, entryCount: 1 });
    expect(points.every((point) => point.date <= '2026-10-10')).toBe(true);
    expect(points.length).toBeGreaterThanOrEqual(3);
  });

  it('registros sem resposta de humor não criam ponto', () => {
    const now = new Date(2026, 9, 10, 12, 0);
    const silent = withUpdates(
      createBlankEntry(new Date(2026, 9, 10, 10, 0)),
      { moodScore: null },
      1,
    );
    const points = dailySeries([silent], dateRange(7, now));
    const today = points.find((point) => point.date === '2026-10-10');
    expect(today).toMatchObject({ entryCount: 1, moodResponses: 0, moodAvg: null });
  });

  it('ignora exemplos fictícios e registros fora da janela', () => {
    const now = new Date(2026, 9, 10, 12, 0);
    const demo = withUpdates(
      createBlankEntry(new Date(2026, 9, 9, 10, 0)),
      { moodScore: 3, isDemo: true },
      1,
    );
    const old = withUpdates(createBlankEntry(new Date(2026, 8, 1, 10, 0)), { moodScore: -3 }, 2);
    const points = dailySeries([demo, old], dateRange(7, now));
    expect(points.every((point) => point.moodAvg === null)).toBe(true);
    expect(points.every((point) => point.entryCount === 0)).toBe(true);
  });

  it('todo o histórico começa no primeiro dia com dados', () => {
    const first = withUpdates(createBlankEntry(new Date(2026, 0, 5, 10, 0)), { moodScore: 1 }, 1);
    const points = dailySeries([first], dateRange(null, new Date(2026, 0, 8, 12, 0)));
    expect(points[0]?.date).toBe('2026-01-05');
    expect(points[points.length - 1]?.date).toBe('2026-01-08');
    expect(points).toHaveLength(4);
  });

  it('calcula sono médio e contagem de impulsos com ausência como null', () => {
    const now = new Date(2026, 9, 10, 12, 0);
    const aBase = createBlankEntry(new Date(2026, 9, 9, 10, 0));
    const a = withUpdates(aBase, { moodScore: 1, metrics: { ...aBase.metrics, sleepHours: 8 } }, 1);
    const b = withUpdates(
      createBlankEntry(new Date(2026, 9, 9, 20, 0)),
      { impulses: [impulseSchema.parse({ id: 'i1', type: 'impulso' })] },
      2,
    );
    const cBase = createBlankEntry(new Date(2026, 9, 10, 9, 0));
    const c = withUpdates(cBase, { metrics: { ...cBase.metrics, sleepHours: 6 } }, 3);

    const points = dailySeries([a, b, c], dateRange(7, now));
    const byDate = new Map(points.map((point) => [point.date, point]));

    expect(byDate.get('2026-10-09')).toMatchObject({
      sleepAvg: 8,
      impulseCount: 1,
      entryCount: 2,
    });
    expect(byDate.get('2026-10-10')).toMatchObject({ sleepAvg: 6, impulseCount: 0 });
    expect(byDate.get('2026-10-08')).toMatchObject({ sleepAvg: null, impulseCount: null });
  });
});

describe('monthMatrix', () => {
  it('alinha a primeira célula ao dia da semana e cobre o mês inteiro', () => {
    const entries = [
      withUpdates(createBlankEntry(new Date(2026, 9, 6, 10, 0)), { moodScore: -2 }, 1),
      withUpdates(createBlankEntry(new Date(2026, 9, 6, 18, 0)), { moodScore: 0 }, 2),
    ];
    const cells = monthMatrix(2026, 9, entries);

    // 01/10/2026 é quinta-feira → 4 células vazias antes do dia 1.
    expect(cells.slice(0, 4).every((cell) => cell === null)).toBe(true);
    expect(cells[4]).toMatchObject({ date: '2026-10-01', day: 1 });
    expect(cells.filter((cell) => cell !== null)).toHaveLength(31);

    const sixth = cells.find((cell) => cell?.date === '2026-10-06');
    expect(sixth).toMatchObject({ day: 6, moodAvg: -1, zone: 'baixo', entryCount: 2 });
  });

  it('marca zona e mantém null em dia sem resposta', () => {
    const withLow = withUpdates(
      createBlankEntry(new Date(2026, 9, 2, 10, 0)),
      { moodScore: -3 },
      1,
    );
    const silent = withUpdates(
      createBlankEntry(new Date(2026, 9, 3, 10, 0)),
      { moodScore: null },
      2,
    );
    const cells = monthMatrix(2026, 9, [withLow, silent]);

    expect(cells.find((cell) => cell?.date === '2026-10-02')).toMatchObject({ zone: 'baixo' });
    expect(cells.find((cell) => cell?.date === '2026-10-03')).toMatchObject({
      zone: null,
      entryCount: 1,
      moodAvg: null,
    });
    expect(cells.find((cell) => cell?.date === '2026-10-04')).toMatchObject({
      zone: null,
      entryCount: 0,
    });
  });
});

describe('topTags', () => {
  it('ordena por contência e limita o resultado', () => {
    const base = new Date(2026, 9, 8, 10, 0).getTime();
    const entries = [1, 2, 3].map((index) =>
      withUpdates(
        createBlankEntry(new Date(base)),
        { tags: [{ kind: 'trigger' as const, label: 'sono ruim' }] },
        index,
      ),
    );
    entries.push(
      withUpdates(
        createBlankEntry(new Date(base)),
        { tags: [{ kind: 'activity' as const, label: 'caminhada' }] },
        4,
      ),
    );

    const result = topTags(entries, dateRange(7, new Date(2026, 9, 10, 12, 0)), 1);
    expect(result).toEqual([{ label: 'sono ruim', count: 3 }]);
  });

  it('ignora tags de registros fictícios', () => {
    const demo = withUpdates(
      createBlankEntry(new Date(2026, 9, 8, 10, 0)),
      { isDemo: true, tags: [{ kind: 'custom' as const, label: 'demo' }] },
      1,
    );
    expect(topTags([demo], dateRange(7, new Date(2026, 9, 10, 12, 0)))).toEqual([]);
  });
});

describe('periodStats', () => {
  it('agrega período sem inventar zeros para médias ausentes', () => {
    const now = new Date(2026, 9, 10, 12, 0);
    const goodBase = createBlankEntry(new Date(2026, 9, 9, 10, 0));
    const good = withUpdates(goodBase, {
      moodScore: 2,
      activationLevel: 4,
      metrics: { ...goodBase.metrics, sleepHours: 8 },
    });
    const bad = withUpdates(createBlankEntry(new Date(2026, 9, 9, 20, 0)), {
      moodScore: -2,
      activationLevel: 2,
      impulses: [impulseSchema.parse({ id: 'i1', type: 'impulso' })],
    });
    const silent = createBlankEntry(new Date(2026, 9, 10, 8, 0));
    const intake = createMedicationEvent(
      { medicationId: 'm1', medicationName: 'Lítio', kind: 'intake' },
      Date.now(),
    );
    const oldIntake = createMedicationEvent(
      { medicationId: 'm1', medicationName: 'Lítio', kind: 'intake', date: '2026-09-01' },
      Date.now(),
    );

    const stats = periodStats([good, bad, silent], [intake, oldIntake], dateRange(7, now));

    expect(stats).toMatchObject({
      entryCount: 3,
      daysWithEntries: 2,
      responseCount: 2,
      avgMood: 0,
      avgActivation: 3,
      intakeCount: 1,
      impulseCount: 1,
    });
    expect(stats.avgSleepHours).toBe(8);
    expect(stats.daysInRange).toBe(7);
  });

  it('sem dados, médias ficam null (nunca 0)', () => {
    const stats = periodStats([], [], dateRange(7, new Date(2026, 9, 10, 12, 0)));
    expect(stats.avgMood).toBeNull();
    expect(stats.avgActivation).toBeNull();
    expect(stats.avgSleepHours).toBeNull();
    expect(stats.daysInRange).toBe(7);
    expect(stats.entryCount).toBe(0);
  });
});

describe('dailyIntakes', () => {
  it('conta apenas tomadas dentro da janela', () => {
    const range = dateRange(7, new Date(2026, 9, 10, 12, 0));
    const inside = createMedicationEvent(
      { medicationId: 'm1', medicationName: 'Lítio', kind: 'intake', date: '2026-10-09' },
      1,
    );
    const outside = createMedicationEvent(
      { medicationId: 'm1', medicationName: 'Lítio', kind: 'intake', date: '2026-09-01' },
      2,
    );
    const adjustment = createMedicationEvent(
      { medicationId: 'm1', medicationName: 'Lítio', kind: 'adjustment', date: '2026-10-09' },
      3,
    );

    const counts = dailyIntakes([inside, outside, adjustment], range);
    expect(counts.get('2026-10-09')).toBe(1);
    expect(counts.has('2026-09-01')).toBe(false);
  });
});

describe('simpleCorrelations', () => {
  it('estima associação perfeita positiva com 5 dias pareados', () => {
    const now = new Date(2026, 9, 10, 12, 0);
    const entries: Entry[] = [];
    for (let i = 0; i < 5; i++) {
      const base = createBlankEntry(new Date(2026, 9, 5 + i, 10, 0));
      entries.push(withUpdates(base, { moodScore: -3 + i, activationLevel: 1 + i }, i + 1));
    }

    const result = simpleCorrelations(entries, dateRange(7, now));
    const pair = result.find((item) => item.key === 'mood-activation');

    expect(result.map((item) => item.key)).toEqual([
      'mood-activation',
      'mood-sleep',
      'mood-impulses',
    ]);
    expect(pair?.n).toBe(5);
    expect(pair?.r).toBe(1);
    expect(pair?.leitura).toContain('positiva forte');
  });

  it('descreve associação negativa sem inferir causa', () => {
    const now = new Date(2026, 9, 10, 12, 0);
    const entries: Entry[] = [];
    for (let i = 0; i < 6; i++) {
      const base = createBlankEntry(new Date(2026, 9, 4 + i, 10, 0));
      entries.push(
        withUpdates(
          base,
          { moodScore: -3 + i, metrics: { ...base.metrics, sleepHours: 10 - i } },
          i + 1,
        ),
      );
    }

    const pair = simpleCorrelations(entries, dateRange(7, now)).find(
      (item) => item.key === 'mood-sleep',
    );

    expect(pair?.n).toBe(6);
    expect(pair?.r).toBe(-1);
    expect(pair?.leitura).toContain('negativa forte');
  });

  it('fica null com menos de 5 dias pareados', () => {
    const now = new Date(2026, 9, 10, 12, 0);
    const entries: Entry[] = [];
    for (let i = 0; i < 4; i++) {
      const base = createBlankEntry(new Date(2026, 9, 6 + i, 10, 0));
      entries.push(withUpdates(base, { moodScore: -2 + i, activationLevel: 1 + i }, i + 1));
    }

    const pair = simpleCorrelations(entries, dateRange(7, now)).find(
      (item) => item.key === 'mood-activation',
    );

    expect(pair?.n).toBe(4);
    expect(pair?.r).toBeNull();
    expect(pair?.leitura).toContain('Dados insuficientes');
  });

  it('sem variação em uma medida, o coeficiente fica null', () => {
    const now = new Date(2026, 9, 10, 12, 0);
    const entries: Entry[] = [];
    for (let i = 0; i < 6; i++) {
      const base = createBlankEntry(new Date(2026, 9, 4 + i, 10, 0));
      entries.push(withUpdates(base, { moodScore: -3 + i, activationLevel: 3 }, i + 1));
    }

    const pair = simpleCorrelations(entries, dateRange(7, now)).find(
      (item) => item.key === 'mood-activation',
    );

    expect(pair?.n).toBe(6);
    expect(pair?.r).toBeNull();
    expect(pair?.leitura).toContain('Sem variação suficiente');
  });
});

describe('date helpers usados pela análise', () => {
  it('addDays permanece no calendário local', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(localDate(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01');
  });
});
