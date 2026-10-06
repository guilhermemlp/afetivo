import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { dailyIntakes, dailySeries, periodStats, topTags } from '@/core/analysis';
import { DISCLAIMER, PERIOD_OPTIONS } from '@/core/constants';
import { dateRange } from '@/core/dates';
import { buttonClass, Card, ChoiceButton, EmptyState, Skeleton } from '@/components/ui';
import { useEntries, useMedicationEvents } from '@/data/hooks';
import { Afetivograma } from './Afetivograma';
import { MedsMoodTimeline } from './MedsMoodTimeline';
import { MoodTrendChart } from './MoodTrendChart';
import { TagFrequency } from './TagFrequency';

/** Média com no máximo 1 casa decimal; vírgula no lugar do ponto. */
function formatAvg(value: number | null): string {
  if (value == null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <li className="rounded-2xl border border-edge bg-panel p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </li>
  );
}

/**
 * Tela "Padrões": período, resumo, humor, ativação, afetivograma,
 * timeline medicação × humor e tags — tudo com lacunas reais (`null`).
 */
export function PatternsPage() {
  const { entries, isLoading } = useEntries();
  const { events, isLoading: eventsLoading } = useMedicationEvents();
  const [period, setPeriod] = useState<number | null>(7);

  const range = useMemo(() => dateRange(period), [period]);
  const points = useMemo(() => dailySeries(entries, range), [entries, range]);
  const stats = useMemo(() => periodStats(entries, events, range), [entries, events, range]);
  const tags = useMemo(() => topTags(entries, range), [entries, range]);
  const intakes = useMemo(() => dailyIntakes(events, range), [events, range]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Padrões</h1>
        <div role="group" aria-label="Período" className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <ChoiceButton
              key={option.label}
              selected={period === option.days}
              onClick={() => setPeriod(option.days)}
            >
              {option.label}
            </ChoiceButton>
          ))}
        </div>
      </div>

      {isLoading || eventsLoading ? (
        <div className="space-y-4">
          <Skeleton size="h-24 w-full" />
          <Skeleton size="h-64 w-full" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          title="Sem dados para analisar"
          description="Registre seu primeiro momento para ver gráficos, afetivograma e padrões."
          action={
            <Link to="/" className={buttonClass()}>
              Registrar um momento
            </Link>
          }
        />
      ) : (
        <>
          <ul
            aria-label="Resumo do período"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          >
            <StatCard label="Registros" value={String(stats.entryCount)} />
            <StatCard
              label="Dias com registro"
              value={stats.daysInRange > 0 ? `${stats.daysWithEntries}/${stats.daysInRange}` : '—'}
            />
            <StatCard label="Humor médio" value={formatAvg(stats.avgMood)} />
            <StatCard
              label="Sono médio"
              value={stats.avgSleepHours != null ? `${formatAvg(stats.avgSleepHours)} h` : '—'}
            />
            <StatCard label="Tomadas" value={String(stats.intakeCount)} />
            <StatCard label="Impulsos" value={String(stats.impulseCount)} />
          </ul>

          {stats.entryCount === 0 && (
            <Card>
              <p className="text-sm">
                Nenhum registro neste período — escolha outro período acima.
              </p>
            </Card>
          )}

          <MoodTrendChart points={points} kind="mood" />
          <MoodTrendChart points={points} kind="activation" />
          <Afetivograma entries={entries} />
          <MedsMoodTimeline points={points} intakes={intakes} />
          <TagFrequency tags={tags} />

          <Card>
            <p className="text-sm text-ink-muted">{DISCLAIMER}</p>
          </Card>
        </>
      )}
    </section>
  );
}
