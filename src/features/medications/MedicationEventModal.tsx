import { useState } from 'react';
import {
  MEDICATION_EVENT_KINDS,
  medicationEventSchema,
  type MedicationEvent,
} from '@/core/medication';
import { INTAKE_STATUS_LABELS, MEDICATION_EVENT_KIND_LABELS } from '@/core/labels';
import { isValidTime } from '@/core/dates';
import { Button, Field, Modal, TextArea, inputClass } from '@/components/ui';
import { useSaveMedicationEvent } from '@/data/hooks';

export interface MedicationEventModalProps {
  /** Edição: evento existente. Criação: informe a medicação de origem. */
  event?: MedicationEvent;
  medication?: { id: string; name: string };
  onClose: () => void;
}

const INTAKE_STATUSES = Object.entries(INTAKE_STATUS_LABELS) as [
  NonNullable<MedicationEvent['status']>,
  string,
][];

/**
 * Evento dose a dose: tomada, ajuste, pausa, retomada ou efeito colateral,
 * cada um com data, horário e situação próprios.
 */
export function MedicationEventModal({ event, medication, onClose }: MedicationEventModalProps) {
  const save = useSaveMedicationEvent();
  const isEdit = event !== undefined;
  const [kind, setKind] = useState<MedicationEvent['kind']>(event?.kind ?? 'intake');
  const [date, setDate] = useState(event?.date ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(event?.time ?? new Date().toTimeString().slice(0, 5));
  const [dose, setDose] = useState(event?.dose ?? '');
  const [status, setStatus] = useState<MedicationEvent['status']>(event?.status ?? 'taken');
  const [sideEffects, setSideEffects] = useState((event?.sideEffects ?? []).join(', '));
  const [notes, setNotes] = useState(event?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  function intakeStatusValue(value: string): MedicationEvent['status'] {
    if (value === '') return null;
    return value as MedicationEvent['status'];
  }

  async function handleSave(): Promise<void> {
    setError(null);
    const now = Date.now();
    try {
      const parsed = medicationEventSchema.parse({
        id: event?.id ?? crypto.randomUUID(),
        medicationId: event?.medicationId ?? medication?.id ?? '',
        medicationName: event?.medicationName ?? medication?.name ?? '',
        kind,
        date,
        time: isValidTime(time) ? time : new Date().toTimeString().slice(0, 5),
        dose: dose.trim() === '' ? null : dose.trim(),
        status: kind === 'intake' ? status : null,
        sideEffects: sideEffects
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        notes: notes.trim() === '' ? null : notes.trim(),
        createdAt: event?.createdAt ?? now,
        updatedAt: now,
      });
      await save.mutateAsync(parsed);
      onClose();
    } catch {
      setError('Não foi possível salvar o evento. Confira os campos.');
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar evento' : `Novo evento${medication ? ` — ${medication.name}` : ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={save.isPending}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          {(control) => (
            <select
              {...control}
              className={inputClass}
              value={kind}
              onChange={(event) => setKind(event.target.value as MedicationEvent['kind'])}
            >
              {MEDICATION_EVENT_KINDS.map((value) => (
                <option key={value} value={value}>
                  {MEDICATION_EVENT_KIND_LABELS[value]}
                </option>
              ))}
            </select>
          )}
        </Field>

        {kind === 'intake' && (
          <Field label="Situação">
            {(control) => (
              <select
                {...control}
                className={inputClass}
                value={status ?? ''}
                onChange={(event) => setStatus(intakeStatusValue(event.target.value))}
              >
                <option value="">Não informado</option>
                {INTAKE_STATUSES.map(([value, label]) => (
                  <option key={label} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}

        <Field label="Data">
          {(control) => (
            <input
              {...control}
              type="date"
              className={inputClass}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          )}
        </Field>

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

        <Field label="Dose" hint="Ex.: “50 mg”, “1 comprimido”.">
          {(control) => (
            <input
              {...control}
              className={inputClass}
              value={dose}
              maxLength={160}
              placeholder="Opcional"
              onChange={(event) => setDose(event.target.value)}
            />
          )}
        </Field>
      </div>

      {kind === 'side_effect' && (
        <Field label="Efeitos colaterais" hint="Separe por vírgula.">
          {(control) => (
            <input
              {...control}
              className={inputClass}
              value={sideEffects}
              placeholder="Ex.: náusea, tontura"
              onChange={(event) => setSideEffects(event.target.value)}
            />
          )}
        </Field>
      )}

      <Field label="Observações">
        {(control) => (
          <TextArea
            {...control}
            value={notes}
            placeholder="Opcional"
            onChange={(event) => setNotes(event.target.value)}
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
