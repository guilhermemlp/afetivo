import type { AfetivoEntry } from '../types/mood';

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}

export function entriesInPeriod(entries: AfetivoEntry[], days: number, now = new Date()): AfetivoEntry[] {
  const today = localDate(now);
  const start = new Date(now);
  start.setDate(start.getDate() - Math.max(0, days - 1));
  const firstDate = localDate(start);
  return entries.filter(entry => isValidDate(entry.date) && (days === 0 || (entry.date >= firstDate && entry.date <= today)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}
