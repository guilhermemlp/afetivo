import { useState } from 'react';
import { isValidTime } from '@/core/dates';
import type { Entry } from '@/core/entry';
import { withUpdates } from '@/core/entry';
import {
  ACTIVATION_VALUES,
  moodLabel,
  VALENCE_LABELS,
  VALENCE_VALUES,
  type Activation,
  type Valence,
} from '@/core/mood';
import { Button, ChoiceButton, Field, Modal, TextArea, inputClass } from '@/components/ui';
import { useDeleteEntry, useSaveEntry } from '@/data/hooks';

export interface EditEntryModalProps {
  entry: Entry;
  onClose: () => void;
}

/**
 * Edição do que o registro rápido cobre: horário, humor, ativação e nota.
 * Exclusão é deliberada em dois passos para não apagar sem querer.
 */
export function EditEntryModal({ entry, onClose }: EditEntryModalProps) {
  const save = useSaveEntry();
  const remove = useDeleteEntry();

  const [time, setTime] = useState(entry.time);
  const [valence, setValence] = useState<Valence | null>(entry.moodScore as Valence | null);
  const [activation, setActivation] = useState<Activation | null>(
    entry.activationLevel as Activation | null,
  );
  const [note, setNote] = useState(entry.journalNotes);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    setError(null);
    const updated = withUpdates(
      entry,
      {
        moodScale: 'valence',
        moodScore: valence,
        activationLevel: activation,
        time: isValidTime(time) ? time : entry.time,
        journalNotes: note,
      },
      Date.now(),
    );
    try {
      await save.mutateAsync(updated);
      onClose();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    }
  }

  async function handleDelete(): Promise<void> {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setError(null);
    try {
      await remove.mutateAsync(entry.id);
      onClose();
    } catch {
      setError('Não foi possível excluir. Tente novamente.');
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Editar registro"
      footer={
        <>
          <Button variant="danger" onClick={handleDelete} loading={remove.isPending}>
            {confirmDelete ? 'Confirmar exclusão' : 'Excluir'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={save.isPending}>
            Salvar
          </Button>
        </>
      }
    >
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

      <fieldset className="space-y-2">
        <legend className="font-medium">Como você se sentiu?</legend>
        {entry.moodScale === 'legacy' && (
          <p className="text-xs text-ink-muted">
            Escala antiga preservada: {moodLabel(entry)}. Escolher um humor abaixo troca este
            registro para a escala atual.
          </p>
        )}
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

      <fieldset className="space-y-2">
        <legend className="font-medium">Ativação</legend>
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

      <Field label="Nota" hint="O que aconteceu, o que ajudou, qualquer observação livre.">
        {(control) => (
          <TextArea {...control} value={note} onChange={(event) => setNote(event.target.value)} />
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
