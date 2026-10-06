import { useState } from 'react';
import {
  MEDICATION_CATEGORIES,
  MEDICATION_FREQUENCIES,
  medicationSchema,
  type Medication,
} from '@/core/medication';
import { MEDICATION_CATEGORY_LABELS, MEDICATION_FREQUENCY_LABELS } from '@/core/labels';
import { Button, Field, Modal, TextArea, inputClass } from '@/components/ui';
import { useSaveMedication } from '@/data/hooks';

export interface MedicationFormModalProps {
  /** Em branco = criação; com valor = edição (id e createdAt preservados). */
  medication?: Medication;
  onClose: () => void;
}

/** Formulário do catálogo: nome, categoria, dose, frequência e vigência. */
export function MedicationFormModal({ medication, onClose }: MedicationFormModalProps) {
  const save = useSaveMedication();
  const [name, setName] = useState(medication?.name ?? '');
  const [category, setCategory] = useState<Medication['category']>(medication?.category ?? 'other');
  const [dosage, setDosage] = useState(medication?.dosage ?? '');
  const [frequency, setFrequency] = useState<Medication['frequency']>(
    medication?.frequency ?? 'daily_night',
  );
  const [notes, setNotes] = useState(medication?.notes ?? '');
  const [active, setActive] = useState(medication?.active ?? true);
  const [startDate, setStartDate] = useState(medication?.startDate ?? '');
  const [endDate, setEndDate] = useState(medication?.endDate ?? '');
  const [error, setError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    setError(null);
    const now = Date.now();
    try {
      const parsed = medicationSchema.parse({
        id: medication?.id ?? crypto.randomUUID(),
        name: name.trim(),
        category,
        dosage: dosage.trim(),
        frequency,
        notes: notes.trim() === '' ? null : notes.trim(),
        active,
        startDate: startDate === '' ? null : startDate,
        endDate: endDate === '' ? null : endDate,
        createdAt: medication?.createdAt ?? now,
        updatedAt: now,
      });
      await save.mutateAsync(parsed);
      onClose();
    } catch {
      setError('Não foi possível salvar. Confira o nome e os campos.');
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={medication ? 'Editar medicação' : 'Nova medicação'}
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
      <Field label="Nome" hint="Ex.: “Lítio”, “Sertralina”, “Melatonina”.">
        {(control) => (
          <input
            {...control}
            className={inputClass}
            value={name}
            maxLength={160}
            placeholder="Nome da medicação"
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoria">
          {(control) => (
            <select
              {...control}
              className={inputClass}
              value={category}
              onChange={(event) => setCategory(event.target.value as Medication['category'])}
            >
              {MEDICATION_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {MEDICATION_CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Dosagem" hint="Texto livre: “300 mg”, “1 comprimido”.">
          {(control) => (
            <input
              {...control}
              className={inputClass}
              value={dosage}
              maxLength={160}
              placeholder="Opcional"
              onChange={(event) => setDosage(event.target.value)}
            />
          )}
        </Field>

        <Field label="Frequência">
          {(control) => (
            <select
              {...control}
              className={inputClass}
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as Medication['frequency'])}
            >
              {MEDICATION_FREQUENCIES.map((value) => (
                <option key={value} value={value}>
                  {MEDICATION_FREQUENCY_LABELS[value]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Em uso">
          {(control) => (
            <select
              {...control}
              className={inputClass}
              value={active ? 'sim' : 'nao'}
              onChange={(event) => setActive(event.target.value === 'sim')}
            >
              <option value="sim">Sim</option>
              <option value="nao">Não (mantém no histórico)</option>
            </select>
          )}
        </Field>

        <Field label="Início">
          {(control) => (
            <input
              {...control}
              type="date"
              className={inputClass}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          )}
        </Field>

        <Field label="Fim" hint="Deixe em branco se ainda está em uso.">
          {(control) => (
            <input
              {...control}
              type="date"
              className={inputClass}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          )}
        </Field>
      </div>

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
