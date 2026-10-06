import { describe, expect, it } from 'vitest';
import { sortEntriesDesc } from '@/core/order';

describe('sortEntriesDesc', () => {
  it('ordena por data decrescente', () => {
    const sorted = sortEntriesDesc([
      { date: '2026-01-01', time: '10:00', createdAt: 1 },
      { date: '2026-03-01', time: '10:00', createdAt: 2 },
      { date: '2026-02-01', time: '10:00', createdAt: 3 },
    ]);
    expect(sorted.map((e) => e.date)).toEqual(['2026-03-01', '2026-02-01', '2026-01-01']);
  });

  it('no mesmo dia, o horário mais tarde vem primeiro', () => {
    const sorted = sortEntriesDesc([
      { date: '2026-01-01', time: '08:00', createdAt: 1 },
      { date: '2026-01-01', time: '21:00', createdAt: 2 },
    ]);
    expect(sorted.map((e) => e.time)).toEqual(['21:00', '08:00']);
  });

  it('no mesmo minuto, o registro mais novo vem primeiro', () => {
    const sorted = sortEntriesDesc([
      { date: '2026-01-01', time: '10:00', createdAt: 100 },
      { date: '2026-01-01', time: '10:00', createdAt: 200 },
    ]);
    expect(sorted.map((e) => e.createdAt)).toEqual([200, 100]);
  });

  it('não modifica o array original', () => {
    const original = [
      { date: '2026-01-01', time: '10:00', createdAt: 1 },
      { date: '2026-02-01', time: '10:00', createdAt: 2 },
    ];
    const copy = [...original];
    sortEntriesDesc(original);
    expect(original).toEqual(copy);
  });
});
