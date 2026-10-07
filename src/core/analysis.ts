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

/**
 * Média para exibição: no máximo 1 casa decimal, vírgula no lugar do ponto;
 * `null` vira "—" (ausência nunca é exibida como zero).
 */
export function formatAvg(value: number | null): string {
  if (value == null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
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
  /** Média de sono (horas) entre quem respondeu; `null` = ninguém respondeu. */
  sleepAvg: number | null;
  /** Total de impulsos registrados no dia; `null` = dia sem registro, `0` = registrado sem impulso. */
  impulseCount: number | null;
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
    const sleeps: number[] = [];
    let impulses = 0;
    for (const entry of dayEntries) {
      if (entry.moodScore != null) moods.push(entry.moodScore);
      if (entry.activationLevel != null) activations.push(entry.activationLevel);
      if (entry.metrics.sleepHours != null) sleeps.push(entry.metrics.sleepHours);
      impulses += entry.impulses.length;
    }
    points.push({
      date,
      moodAvg: mean(moods),
      activationAvg: mean(activations),
      sleepAvg: mean(sleeps),
      impulseCount: dayEntries.length > 0 ? impulses : null,
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

export type CorrelationPair = 'mood-activation' | 'mood-sleep' | 'mood-impulses';

export interface Correlation {
  key: CorrelationPair;
  label: string;
  /** Pearson arredondado em 2 casas; `null` = dias insuficientes ou sem variação. */
  r: number | null;
  /** Dias onde **ambos** do par têm valor. */
  n: number;
  /** Leitura descritiva — nunca afirma causa ou efeito. */
  leitura: string;
}

/** Mínimo de dias pareados para estimar um coeficiente. */
const MIN_PAIR_DAYS = 5;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function pearson(pairs: Array<[number, number]>): number | null {
  const n = pairs.length;
  if (n < 2) return null;
  const meanX = pairs.reduce((sum, [x]) => sum + x, 0) / n;
  const meanY = pairs.reduce((sum, [, y]) => sum + y, 0) / n;
  let numerator = 0;
  let sumDx2 = 0;
  let sumDy2 = 0;
  for (const [x, y] of pairs) {
    const dx = x - meanX;
    const dy = y - meanY;
    numerator += dx * dy;
    sumDx2 += dx * dx;
    sumDy2 += dy * dy;
  }
  if (sumDx2 === 0 || sumDy2 === 0) return null;
  return numerator / Math.sqrt(sumDx2 * sumDy2);
}

function correlationLeitura(r: number | null, n: number): string {
  if (r == null) {
    return n < MIN_PAIR_DAYS
      ? `Dados insuficientes — ${n} dia(s) com os dois valores (mínimo ${MIN_PAIR_DAYS}).`
      : 'Sem variação suficiente nos dados para estimar.';
  }
  const magnitude = Math.abs(r);
  const forca = magnitude < 0.3 ? 'fraca' : magnitude < 0.6 ? 'moderada' : 'forte';
  const direcao = r >= 0 ? 'positiva' : 'negativa';
  return `Associação ${direcao} ${forca} (r = ${round2(r).toFixed(2).replace('.', ',')}, n = ${n} dias).`;
}

const CORRELATION_PAIRS: Array<{
  key: CorrelationPair;
  label: string;
  x: (point: DayPoint) => number | null;
  y: (point: DayPoint) => number | null;
}> = [
  {
    key: 'mood-activation',
    label: 'Humor × ativação',
    x: (p) => p.moodAvg,
    y: (p) => p.activationAvg,
  },
  { key: 'mood-sleep', label: 'Humor × sono', x: (p) => p.moodAvg, y: (p) => p.sleepAvg },
  {
    key: 'mood-impulses',
    label: 'Humor × impulsos',
    x: (p) => p.moodAvg,
    y: (p) => p.impulseCount,
  },
];

/**
 * Correlações simples de Pearson por dia na janela: só entra o par quando
 * **ambos** respondidos no mesmo dia; abaixo de `MIN_PAIR_DAYS` dias ou sem
 * variação, `r` fica `null`. Descritivo — não infere causa, tratamento ou dose.
 */
export function simpleCorrelations(entries: Entry[], range: DateRange): Correlation[] {
  const points = dailySeries(entries, range);
  return CORRELATION_PAIRS.map(({ key, label, x, y }) => {
    const pairs: Array<[number, number]> = [];
    for (const point of points) {
      const a = x(point);
      const b = y(point);
      if (a != null && b != null) pairs.push([a, b]);
    }
    const n = pairs.length;
    const r = n >= MIN_PAIR_DAYS ? pearson(pairs) : null;
    return {
      key,
      label,
      r: r == null ? null : round2(r),
      n,
      leitura: correlationLeitura(r, n),
    };
  });
}
