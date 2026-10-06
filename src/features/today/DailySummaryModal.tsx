import { useState } from 'react';
import { entrySchema, type Entry } from '@/core/entry';
import {
  ACTIVATION_VALUES,
  VALENCE_LABELS,
  VALENCE_VALUES,
  type Activation,
  type Valence,
} from '@/core/mood';
import { Button, ChoiceButton, Field, Modal } from '@/components/ui';
import { useSaveEntry } from '@/data/hooks';

export interface DailySummaryModalProps {
  entry: Entry;
  onClose: () => void;
}

/**
 * Fechamento do dia (`recordKind: 'daily_summary'`): um por data, perguntas
 * curtas — como foi o dia, ativação e nota. Detalhes continuam disponíveis
 * no formulário completo pelo diário.
 */
export function DailySummaryModal({ entry, onClose }: DailySummaryModalProps) {
  const save = useSaveEntry();
  const [valence, setValence] = useState<Valence | null>(entry.moodScore as Valence | null);
  const [activation, setActivation] = useState<Activation | null>(
    entry.activationLevel as Activation | null,
  );
  const [note, setNote] = useState(entry.journalNotes);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    setError(null);
    try {
      const parsed = entrySchema.parse({
        ...entry,
        moodScale: 'valence',
        moodScore: valence,
        activationLevel: activation,
        journalNotes: note,
        recordKind: 'daily_summary',
        updatedAt: Date.now(),
      });
      await save.mutateAsync(parsed);
      onClose();
    } catch {
      setError('Não foi possível salvar o resumo. Tente novamente.');
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Resumo do dia"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={save.isPending}>
            Salvar resumo
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">
        Como foi o dia inteiro — responda só o que quiser, leva poucos segundos.
      </p>

      <fieldset className="space-y-2">
        <legend className="font-medium">Como foi o dia?</legend>
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
            ariaLabel="Pular humor do dia"
          >
            Pular
          </ChoiceButton>
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-medium">Quanto de energia o dia teve?</legend>
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
          <ChoiceButton
            selected={activation === null}
            onClick={() => setActivation(null)}
            ariaLabel="Pular ativação do dia"
          >
            Pular
          </ChoiceButton>
        </div>
      </fieldset>

      <Field label="Nota do dia">
        {(control) => (
          <textarea
            {...control}
            className="w-full min-h-24 rounded-xl border border-edge bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted"
            value={note}
            maxLength={4000}
            placeholder="O que marcou o dia, o que ajudou, como você está"
            onChange={(event) => setNote(event.target.value)}
          />
        )}
      </Field>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
