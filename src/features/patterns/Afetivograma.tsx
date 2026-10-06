import { useMemo, useState } from 'react';
import { monthMatrix, type MonthDay } from '@/core/analysis';
import { formatDateBR } from '@/core/dates';
import type { Entry } from '@/core/entry';
import type { MoodZone } from '@/core/mood';
import { Card } from '@/components/ui';

const MONTHS_BR = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const;

/**
 * Zonas com cores mid-tone fixas (claras o suficiente em tema escuro, escuras
 * o suficiente em tema claro) — o texto da célula fica sempre escuro por cima.
 */
const ZONE_COLORS: Record<MoodZone, string> = {
  baixo: '#f87171',
  equilibrado: '#2dd4bf',
  elevado: '#fbbf24',
};

const ZONE_LEGEND: readonly { zone: MoodZone; label: string }[] = [
  { zone: 'baixo', label: 'Baixo' },
  { zone: 'equilibrado', label: 'Equilibrado' },
  { zone: 'elevado', label: 'Elevado' },
];

function cellTitle(cell: MonthDay): string {
  const day = formatDateBR(cell.date);
  if (cell.entryCount === 0) return `${day}: sem registros`;
  const records = cell.entryCount === 1 ? '1 registro' : `${cell.entryCount} registros`;
  if (cell.moodAvg == null) return `${day}: ${records}, humor não informado`;
  return `${day}: humor médio ${cell.moodAvg}, ${records}`;
}

export interface AfetivogramaProps {
  entries: Entry[];
}

/** Grade mensal de humor médio por dia, com navegação de mês. */
export function Afetivograma({ entries }: AfetivogramaProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const cells = useMemo(() => monthMatrix(cursor.year, cursor.month, entries), [cursor, entries]);

  const now = new Date();
  const isCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth();
  const monthLabel = `${MONTHS_BR[cursor.month]} de ${cursor.year}`;

  const shiftMonth = (delta: number) => {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Afetivograma</h2>
          <p className="mt-1 text-sm text-ink-muted">Humor médio por dia do mês.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => shiftMonth(-1)}
            className="min-h-11 min-w-11 rounded-xl border border-edge bg-panel text-lg hover:bg-panel-2"
          >
            ‹
          </button>
          <span aria-live="polite" className="min-w-36 text-center text-sm font-medium">
            {monthLabel}
          </span>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            className="min-h-11 min-w-11 rounded-xl border border-edge bg-panel text-lg hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-4" role="group" aria-label={`Dias de ${monthLabel}`}>
        <div
          aria-hidden="true"
          className="grid grid-cols-7 gap-1 text-center text-xs text-ink-muted"
        >
          {WEEKDAYS_SHORT.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell, index) =>
            cell === null ? (
              <span key={`gap-${index}`} aria-hidden="true" className="aspect-square" />
            ) : (
              <div
                key={cell.date}
                role="img"
                aria-label={cellTitle(cell)}
                title={cellTitle(cell)}
                className={[
                  'flex aspect-square flex-col items-center justify-center rounded-lg text-xs',
                  cell.zone ? 'font-semibold' : 'bg-panel-2 text-ink-muted',
                ].join(' ')}
                style={
                  cell.zone
                    ? { backgroundColor: ZONE_COLORS[cell.zone], color: '#16202a' }
                    : undefined
                }
              >
                <span>{cell.day}</span>
                {cell.entryCount > 0 && (
                  <span className="text-[10px] tabular-nums">{cell.moodAvg ?? '—'}</span>
                )}
              </div>
            ),
          )}
        </div>
      </div>

      <ul
        aria-label="Legenda das zonas"
        className="mt-3 flex flex-wrap gap-3 text-xs text-ink-muted"
      >
        {ZONE_LEGEND.map((item) => (
          <li key={item.zone} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded"
              style={{ backgroundColor: ZONE_COLORS[item.zone] }}
            />
            {item.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded border border-edge bg-panel-2"
          />
          Sem dados
        </li>
      </ul>
    </Card>
  );
}
