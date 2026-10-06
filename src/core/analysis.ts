import { addDays, isWithinRange, localDate, type DateRange } from './dates';
import type { Entry } from './entry';
import type { MedicationEvent } from './medication';
import { moodZone, type MoodZone } from './mood';

/**
 * Análise local e determinística sobre os registros. Regras:
 * - ausente = `null` (nunca 0): dia sem resposta não vira ponto;
 * - exemplos fictícios (`isDemo`) ficam fora de qualquer cálculo;
 * - nada aqui recomenda dose, tratamento ou diagnóstico.
 */

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function scopedEntries(entries: Entry[], range: DateRange): Entry[] {
  return entries.filter((entry) => !entry.isDemo && isWithinRange(entry.date, range));
}

function groupByDate(entries: Entry[]): Map<string, Entry[]> {
  const byDate = new Map<string, Entry[]>();
  for (const entry of entries) {
    const list = byDate.get(entry.date);
    if (list) {
      list.push(entry);
    } else {
      byDate.set(entry.date, [entry]);
    }
  }
  return byDate;
}

export interface DayPoint {
  /** Dia calendário (`YYYY-MM-DD`). */
  date: string;
  /** Média do humor nos registros **que responderam**; `null` = ninguém respondeu. */
  moodAvg: number | null;
  activationAvg: number | null;
  /** Total de registros do dia (inclui os sem resposta de humor). */
  entryCount: number;
  /** Registros com humor respondido no dia. */
  moodResponses: number;
}

/**
 * Série diária contínua da janela: dias sem registro aparecem com `null`
 * (lacuna no gráfico — a linha nunca infere valor entre respostas).
 * Com `range.start === null` ("todo o histórico"), começa no primeiro dia
 * com dados e termina em `range.end`.
 */
export function dailySeries(entries: Entry[], range: DateRange): DayPoint[] {
  const byDate = groupByDate(scopedEntries(entries, range));
  const knownDates = [...byDate.keys()].sort();
  const start = range.start ?? knownDates[0] ?? range.end;
  if (start > range.end) return [];

  const points: DayPoint[] = [];
  for (let date = start; date <= range.end; date = addDays(date, 1)) {
    const dayEntries = byDate.get(date) ?? [];
    const moods: number[] = [];
    const activations: number[] = [];
    for (const entry of dayEntries) {
      if (entry.moodScore != null) moods.push(entry.moodScore);
      if (entry.activationLevel != null) activations.push(entry.activationLevel);
    }
    points.push({
      date,
      moodAvg: mean(moods),
      activationAvg: mean(activations),
      entryCount: dayEntries.length,
      moodResponses: moods.length,
    });
  }
  return points;
}

export interface MonthDay {
  date: string;
  day: number;
  moodAvg: number | null;
  zone: MoodZone | null;
  entryCount: number;
}

/**
 * Células do afetivograma mensal: `null` no início (alinhamento da semana) e
 * um `MonthDay` por dia do mês; dias sem resposta ficam com `zone: null`.
 */
export function monthMatrix(year: number, month: number, entries: Entry[]): (MonthDay | null)[] {
  const byDate = groupByDate(entries.filter((entry) => !entry.isDemo));
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (MonthDay | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = localDate(new Date(year, month, day));
    const dayEntries = byDate.get(date) ?? [];
    const moods: number[] = [];
    for (const entry of dayEntries) {
      if (entry.moodScore != null) moods.push(entry.moodScore);
    }
    const moodAvg = mean(moods);
    cells.push({
      date,
      day,
      moodAvg,
      zone: moodAvg == null ? null : moodZone(moodAvg),
      entryCount: dayEntries.length,
    });
  }
  return cells;
}

export interface TagCount {
  label: string;
  count: number;
}

/** Tags mais usadas no período (ordem: contagem decrescente, depois alfabética). */
export function topTags(entries: Entry[], range: DateRange, limit = 10): TagCount[] {
  const counts = new Map<string, number>();
  for (const entry of scopedEntries(entries, range)) {
    for (const tag of entry.tags) {
      counts.set(tag.label, (counts.get(tag.label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
    .slice(0, limit);
}

function daysInclusive(start: string, end: string): number {
  const first = new Date(`${start}T12:00:00`).getTime();
  const last = new Date(`${end}T12:00:00`).getTime();
  return Math.max(1, Math.round((last - first) / 86_400_000) + 1);
}

export interface PeriodStats {
  entryCount: number;
  daysWithEntries: number;
  daysInRange: number;
  /** Registros com humor respondido (base das médias). */
  responseCount: number;
  avgMood: number | null;
  avgActivation: number | null;
  avgSleepHours: number | null;
  intakeCount: number;
  impulseCount: number;
}

/** Resumo descritivo do período. Médias ficam em `null` quando não há base. */
export function periodStats(
  entries: Entry[],
  medicationEvents: MedicationEvent[],
  range: DateRange,
): PeriodStats {
  const scoped = scopedEntries(entries, range);
  const byDate = groupByDate(scoped);

  const moods: number[] = [];
  const activations: number[] = [];
  const sleepHours: number[] = [];
  let impulseCount = 0;
  for (const entry of scoped) {
    if (entry.moodScore != null) moods.push(entry.moodScore);
    if (entry.activationLevel != null) activations.push(entry.activationLevel);
    if (entry.metrics.sleepHours != null) sleepHours.push(entry.metrics.sleepHours);
    impulseCount += entry.impulses.length;
  }

  const knownDates = [...byDate.keys()].sort();
  const daysInRange =
    range.start != null
      ? daysInclusive(range.start, range.end)
      : knownDates.length > 0
        ? daysInclusive(knownDates[0] ?? range.end, range.end)
        : 0;

  return {
    entryCount: scoped.length,
    daysWithEntries: byDate.size,
    daysInRange,
    responseCount: moods.length,
    avgMood: mean(moods),
    avgActivation: mean(activations),
    avgSleepHours: mean(sleepHours),
    intakeCount: medicationEvents.filter(
      (event) => event.kind === 'intake' && isWithinRange(event.date, range),
    ).length,
    impulseCount,
  };
}

/** Tomadas por dia na janela (para a timeline medicação × humor). */
export function dailyIntakes(
  medicationEvents: MedicationEvent[],
  range: DateRange,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of medicationEvents) {
    if (event.kind !== 'intake' || !isWithinRange(event.date, range)) continue;
    counts.set(event.date, (counts.get(event.date) ?? 0) + 1);
  }
  return counts;
}
