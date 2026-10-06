/**
 * Utilitários de data e hora no calendário LOCAL.
 *
 * Regra herdada do v1: nenhuma data de registro passa por UTC — às 21h no
 * Brasil o dia ainda é o mesmo dia, nunca o dia seguinte.
 */

/** Converte uma data para o padrão `YYYY-MM-DD` usando o fuso local. */
export function localDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Valida datas reais do calendário (rejeita `2026-02-30`, por exemplo). */
export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && localDate(parsed) === value;
}

/** Valida horários no formato `HH:mm` de 00:00 a 23:59. */
export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Horário local no formato `HH:mm`. */
export function localTime(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Soma (ou subtrai) dias a uma data `YYYY-MM-DD` sem passar por UTC. */
export function addDays(dateISO: string, days: number): string {
  const parsed = new Date(`${dateISO}T12:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return localDate(parsed);
}

export interface DateRange {
  /** Início inclusivo ou `null` para "todo o histórico". */
  start: string | null;
  /** Fim inclusivo (normalmente hoje). */
  end: string;
}

/**
 * Janela de dias do calendário. `periodDays: null` representa todo o
 * histórico; `periodDays: 7` inclui hoje e os 6 dias anteriores.
 */
export function dateRange(periodDays: number | null, now: Date = new Date()): DateRange {
  const end = localDate(now);
  if (periodDays == null) return { start: null, end };
  return { start: addDays(end, -(Math.max(1, Math.trunc(periodDays)) - 1)), end };
}

export function isWithinRange(date: string, range: DateRange): boolean {
  if (date > range.end) return false;
  return range.start === null || date >= range.start;
}

/** Formata `YYYY-MM-DD` como `DD/MM/YYYY` (apenas exibição). */
export function formatDateBR(dateISO: string): string {
  const [year, month, day] = dateISO.split('-');
  if (!year || !month || !day) return dateISO;
  return `${day}/${month}/${year}`;
}

const WEEKDAYS_BR = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const;

/** Dia da semana curto em português (`seg`, `ter`, ...). */
export function weekdayBR(dateISO: string): string {
  const parsed = new Date(`${dateISO}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return WEEKDAYS_BR[parsed.getDay()] ?? '';
}
