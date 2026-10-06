import { describe, expect, it } from 'vitest';
import {
  addDays,
  dateRange,
  formatDateBR,
  isWithinRange,
  isValidDate,
  isValidTime,
  localDate,
  weekdayBR,
} from '@/core/dates';

describe('isValidDate', () => {
  it('aceita datas reais do calendário', () => {
    expect(isValidDate('2026-02-28')).toBe(true);
    expect(isValidDate('2024-02-29')).toBe(true); // bissexto
  });

  it('rejeita datas impossíveis e formatos errados', () => {
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-1-1')).toBe(false);
    expect(isValidDate('amanhã')).toBe(false);
    expect(isValidDate(20260101)).toBe(false);
    expect(isValidDate(null)).toBe(false);
  });
});

describe('isValidTime', () => {
  it('aceita de 00:00 a 23:59', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('08:30')).toBe(true);
  });

  it('rejeita horários inválidos', () => {
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:5')).toBe(false);
    expect(isValidTime('08:60')).toBe(false);
    expect(isValidTime(undefined)).toBe(false);
  });
});

describe('localDate', () => {
  it('usa o calendário local, não UTC', () => {
    // 21:30 do dia 6 — em UTC-3 ainda é o mesmo dia.
    expect(localDate(new Date(2026, 9, 6, 21, 30))).toBe('2026-10-06');
    expect(localDate(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });
});

describe('addDays', () => {
  it('cruza meses e anos sem passar por UTC', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-10-06', 7)).toBe('2026-10-13');
  });
});

describe('dateRange', () => {
  it('janela de 7 dias inclui hoje e os 6 anteriores', () => {
    const now = new Date(2026, 9, 6);
    expect(dateRange(7, now)).toEqual({ start: '2026-09-30', end: '2026-10-06' });
  });

  it('todo o histórico tem início nulo', () => {
    const now = new Date(2026, 9, 6);
    expect(dateRange(null, now)).toEqual({ start: null, end: '2026-10-06' });
  });
});

describe('isWithinRange', () => {
  const range = { start: '2026-09-30', end: '2026-10-06' };

  it('inclui os extremos e exclui fora da janela', () => {
    expect(isWithinRange('2026-09-30', range)).toBe(true);
    expect(isWithinRange('2026-10-06', range)).toBe(true);
    expect(isWithinRange('2026-09-29', range)).toBe(false);
    expect(isWithinRange('2026-10-07', range)).toBe(false);
  });

  it('com início nulo aceita qualquer data até o fim', () => {
    const all = { start: null, end: '2026-10-06' };
    expect(isWithinRange('2020-01-01', all)).toBe(true);
    expect(isWithinRange('2026-10-07', all)).toBe(false);
  });
});

describe('formatação', () => {
  it('formata data em pt-BR e dia da semana', () => {
    expect(formatDateBR('2026-10-06')).toBe('06/10/2026');
    expect(weekdayBR('2026-10-06')).toBe('ter');
    expect(weekdayBR('2026-10-05')).toBe('seg');
    expect(weekdayBR('2026-10-04')).toBe('dom');
  });
});
