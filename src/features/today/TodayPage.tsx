import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isValidTime, localDate, localTime } from '@/core/dates';
import { createBlankEntry, withUpdates, type Entry } from '@/core/entry';
import {
  ACTIVATION_VALUES,
  moodLabel,
  VALENCE_LABELS,
  VALENCE_VALUES,
  type Activation,
  type Valence,
} from '@/core/mood';
import {
  Button,
  Card,
  ChoiceButton,
  EmptyState,
  Field,
  Skeleton,
  inputClass,
} from '@/components/ui';
import { useEntries, useSaveEntry } from '@/data/hooks';
import { EntryDetailsModal } from '@/features/entryDetails/EntryDetailsModal';
import { DailySummaryModal } from './DailySummaryModal';

const QUICK_SCALES = [
  { key: 'anxiety', label: 'Ansiedade' },
  { key: 'urge', label: 'Impulso / compulsão' },
  { key: 'isolation', label: 'Falta / isolamento' },
] as const;

type QuickScaleKey = (typeof QUICK_SCALES)[number]['key'];
type Status = { kind: 'ok' | 'error'; text: string } | null;

/**
 * Registro rápido: duas perguntas (humor e ativação) mais três escalas
 * opcionais — tudo pulável. Vários registros por dia, sem sequência nem
 * cobrança de preenchimento.
 */
export function TodayPage() {
  const { entries, isLoading } = useEntries();
  const save = useSaveEntry();

  const [valence, setValence] = useState<Valence | null>(null);
  const [activation, setActivation] = useState<Activation | null>(null);
  const [scales, setScales] = useState<Record<QuickScaleKey, number | null>>({
    anxiety: null,
    urge: null,
    isolation: null,
  });
  const [time, setTime] = useState(() => localTime(new Date()));
  const [status, setStatus] = useState<Status>(null);
  const [details, setDetails] = useState<Entry | null>(null);
  const [summaryDraft, setSummaryDraft] = useState<Entry | null>(null);

  const today = localDate(new Date());
  const todayEntries = useMemo(
    () => entries.filter((entry) => entry.date === today),
    [entries, today],
  );
  const dailySummary = useMemo(
    () => todayEntries.find((entry) => entry.recordKind === 'daily_summary') ?? null,
    [todayEntries],
  );

  /** Detalhes vão para o registro mais recente de hoje (ou um novo). */
  function openDetails(): void {
    setDetails(todayEntries[0] ?? createBlankEntry());
  }

  /** Resumo: um por dia — edita o existente ou cria o de hoje. */
  function openSummary(): void {
    setSummaryDraft(
      dailySummary ?? withUpdates(createBlankEntry(), { recordKind: 'daily_summary' }),
    );
  }

  function updateScale(key: QuickScaleKey, value: number | null): void {
    setScales((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(): Promise<void> {
    const now = new Date();
    const base = createBlankEntry(now);
    const entry = withUpdates(base, {
      moodScale: 'valence',
      moodScore: valence,
      activationLevel: activation,
      time: isValidTime(time) ? time : localTime(now),
      metrics: {
        ...base.metrics,
        anxiety: scales.anxiety,
        urge: scales.urge,
        isolation: scales.isolation,
      },
    });

    try {
      await save.mutateAsync(entry);
      setValence(null);
      setActivation(null);
      setScales({ anxiety: null, urge: null, isolation: null });
      setTime(localTime(new Date()));
      setStatus({ kind: 'ok', text: `Registro salvo às ${entry.time}.` });
    } catch {
      setStatus({ kind: 'error', text: 'Não foi possível salvar o registro. Tente novamente.' });
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Hoje</h1>

      <Card>
        <h2 className="text-lg font-semibold">Registro rápido</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Humor e ativação bastam; o resto é opcional e pode ficar em branco.
        </p>

        <fieldset className="mt-5 space-y-2">
          <legend className="font-medium">1. Como você se sente?</legend>
          <p className="text-xs text-ink-muted">De desagradável a agradável.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {VALENCE_VALUES.map((score) => (
              <ChoiceButton
                key={score}
                selected={valence === score}
                onClick={() => setValence(score)}
              >
                {VALENCE_LABELS[score]}
              </ChoiceButton>
            ))}
            <ChoiceButton
              selected={valence === null}
              onClick={() => setValence(null)}
              ariaLabel="Pular humor"
            >
              Pular
            </ChoiceButton>
          </div>
        </fieldset>

        <fieldset className="mt-5 space-y-2">
          <legend className="font-medium">2. Quanto você está ativado?</legend>
          <p className="text-xs text-ink-muted">Pouco ↔ muito (1 a 5).</p>
          <div className="grid grid-cols-5 gap-2">
            {ACTIVATION_VALUES.map((level) => (
              <ChoiceButton
                key={level}
                selected={activation === level}
                onClick={() => setActivation(level)}
                ariaLabel={`Ativação ${level}`}
              >
                {level}
              </ChoiceButton>
            ))}
          </div>
          <ChoiceButton
            selected={activation === null}
            onClick={() => setActivation(null)}
            ariaLabel="Pular ativação"
          >
            Pular ativação
          </ChoiceButton>
        </fieldset>

        <fieldset className="mt-5 space-y-2">
          <legend className="font-medium">Se quiser, como está agora?</legend>
          <p className="text-xs text-ink-muted">
            Escalas opcionais de 0 a 10. Em branco continua “não informado”.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {QUICK_SCALES.map((scale) => (
              <Field key={scale.key} label={scale.label}>
                {(control) => (
                  <select
                    {...control}
                    className={inputClass}
                    value={scales[scale.key] ?? ''}
                    onChange={(event) =>
                      updateScale(
                        scale.key,
                        event.target.value === '' ? null : Number(event.target.value),
                      )
                    }
                  >
                    <option value="">Não informado</option>
                    {Array.from({ length: 11 }, (_, value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:flex-1">
            <Field label="Horário">
              {(control) => (
                <input
                  {...control}
                  type="time"
                  className={inputClass}
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              )}
            </Field>
          </div>
          <Button onClick={handleSave} loading={save.isPending} className="w-full sm:w-auto">
            Salvar registro
          </Button>
          <Button variant="secondary" onClick={openDetails} className="w-full sm:w-auto">
            Mais detalhes
          </Button>
        </div>

        {status && (
          <p
            role={status.kind === 'error' ? 'alert' : 'status'}
            className={`mt-3 text-sm ${status.kind === 'error' ? 'text-danger' : 'text-ink-muted'}`}
          >
            {status.text}
          </p>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Resumo do dia</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Fechamento do dia: um por data, com o que você quiser anotar.
            </p>
          </div>
          <Button variant="secondary" onClick={openSummary} className="w-full sm:w-auto">
            {dailySummary ? 'Editar resumo' : 'Fechar o dia'}
          </Button>
        </div>
        {dailySummary && (
          <div className="mt-3 rounded-2xl border border-edge bg-panel-2 p-4 text-sm">
            <p className="font-medium">{moodLabel(dailySummary)}</p>
            {dailySummary.journalNotes && (
              <p className="mt-1 whitespace-pre-wrap text-ink-muted">{dailySummary.journalNotes}</p>
            )}
          </div>
        )}
      </Card>

      <section aria-labelledby="registros-hoje" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="registros-hoje" className="text-lg font-semibold">
            Registros de hoje
          </h2>
          <Link to="/diario" className="text-sm text-brand hover:underline">
            Abrir diário
          </Link>
        </div>

        {isLoading ? (
          <Skeleton size="h-24 w-full" />
        ) : todayEntries.length === 0 ? (
          <EmptyState
            title="Nenhum registro hoje"
            description="Um momento leva poucos segundos — e você pode registrar quantas vezes quiser."
          />
        ) : (
          <ul className="divide-y divide-edge rounded-2xl border border-edge bg-panel">
            {todayEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
              >
                <span className="font-medium tabular-nums">{entry.time}</span>
                <span className="flex items-center gap-2">
                  {entry.recordKind === 'daily_summary' && (
                    <span className="rounded-full bg-panel-2 px-2 py-0.5 text-xs text-ink-muted">
                      Resumo do dia
                    </span>
                  )}
                  {moodLabel(entry)}
                </span>
                <span className="text-ink-muted">
                  {entry.activationLevel == null
                    ? 'Ativação não informada'
                    : `Ativação ${entry.activationLevel}/5`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {details && (
        <EntryDetailsModal key={details.id} entry={details} onClose={() => setDetails(null)} />
      )}
      {summaryDraft && (
        <DailySummaryModal
          key={summaryDraft.id}
          entry={summaryDraft}
          onClose={() => setSummaryDraft(null)}
        />
      )}
    </section>
  );
}
