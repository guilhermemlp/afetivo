import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDateBR, weekdayBR } from '@/core/dates';
import type { Entry } from '@/core/entry';
import { moodLabel, moodZone } from '@/core/mood';
import { buttonClass, ChoiceButton, EmptyState, Field, Skeleton } from '@/components/ui';
import { useEntries } from '@/data/hooks';
import { EntryDetailsModal } from '@/features/entryDetails/EntryDetailsModal';
import { EditEntryModal } from './EditEntryModal';

type ZoneFilter = 'todas' | 'baixo' | 'equilibrado' | 'elevado';

const ZONE_FILTERS: readonly { value: ZoneFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'baixo', label: 'Baixo' },
  { value: 'equilibrado', label: 'Equilibrado' },
  { value: 'elevado', label: 'Elevado' },
];

function matchesQuery(entry: Entry, needle: string): boolean {
  const haystack = [
    entry.journalNotes,
    entry.gratitudeNotes ?? '',
    ...entry.tags.map((tag) => tag.label),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function activationText(entry: Entry): string {
  return entry.activationLevel == null
    ? 'Ativação não informada'
    : `Ativação ${entry.activationLevel}/5`;
}

/** Feed completo do histórico: busca, filtro por humor e edição inline. */
export function JournalPage() {
  const { entries, isLoading } = useEntries();
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState<ZoneFilter>('todas');
  const [editing, setEditing] = useState<Entry | null>(null);
  const [details, setDetails] = useState<Entry | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (zone !== 'todas' && moodZone(entry.moodScore) !== zone) return false;
      return needle === '' || matchesQuery(entry, needle);
    });
  }, [entries, query, zone]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Diário</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="Buscar">
            {(control) => (
              <input
                {...control}
                type="search"
                placeholder="Notas, tags, gratidão…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            )}
          </Field>
        </div>
        <div role="group" aria-label="Filtrar por humor" className="flex flex-wrap gap-2">
          {ZONE_FILTERS.map((filter) => (
            <ChoiceButton
              key={filter.value}
              selected={zone === filter.value}
              onClick={() => setZone(filter.value)}
            >
              {filter.label}
            </ChoiceButton>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton size="h-40 w-full" />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Nenhum registro ainda"
          description="Seu histórico começa no primeiro momento registrado."
          action={
            <Link to="/" className={buttonClass()}>
              Registrar um momento
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum resultado"
          description="Nenhum registro corresponde à busca ou ao filtro escolhido."
          action={
            <button
              type="button"
              className={buttonClass('secondary')}
              onClick={() => {
                setQuery('');
                setZone('todas');
              }}
            >
              Limpar busca e filtros
            </button>
          }
        />
      ) : (
        <ul className="divide-y divide-edge rounded-2xl border border-edge bg-panel">
          {filtered.map((entry) => (
            <li key={entry.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  <span className="font-semibold">{formatDateBR(entry.date)}</span>
                  <span className="text-ink-muted">
                    {' '}
                    · {weekdayBR(entry.date)} · {entry.time}
                  </span>
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={buttonClass('ghost', 'sm')}
                    onClick={() => setDetails(entry)}
                    aria-label={`Detalhes do registro das ${entry.time} em ${formatDateBR(entry.date)}`}
                  >
                    Detalhes
                  </button>
                  <button
                    type="button"
                    className={buttonClass('ghost', 'sm')}
                    onClick={() => setEditing(entry)}
                    aria-label={`Editar registro das ${entry.time} em ${formatDateBR(entry.date)}`}
                  >
                    Editar
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm">
                {moodLabel(entry)} · {activationText(entry)}
              </p>
              {entry.journalNotes && (
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{entry.journalNotes}</p>
              )}
              {entry.tags.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {entry.tags.slice(0, 6).map((tag) => (
                    <li
                      key={`${tag.kind}:${tag.label}`}
                      className="rounded-full bg-panel-2 px-2 py-0.5 text-xs text-ink-muted"
                    >
                      {tag.label}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EditEntryModal key={editing.id} entry={editing} onClose={() => setEditing(null)} />
      )}
      {details && (
        <EntryDetailsModal key={details.id} entry={details} onClose={() => setDetails(null)} />
      )}
    </section>
  );
}
