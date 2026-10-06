import React from 'react';
import { Trash2 } from 'lucide-react';
import {
  AfetivoEntry,
  ImpulsiveBehavior,
  Medication,
  PhysicalActivity,
} from '../../types/mood';
import { OUTCOME_LABELS } from '../../services/observations';
import {
  buttonClass,
  EntryChange,
  fieldClass,
  ObservedChange,
} from './shared';

interface ImpulseSectionProps {
  entry: AfetivoEntry;
  onChange: EntryChange;
  onObservedChange: ObservedChange;
  onImpulseChange: (id: string, patch: Partial<ImpulsiveBehavior>) => void;
}

export const ImpulseSection: React.FC<ImpulseSectionProps> = ({
  entry,
  onChange,
  onObservedChange,
  onImpulseChange,
}) => (
  <details>
    <summary className="cursor-pointer font-semibold py-2">
      Ocorrências detalhadas de impulso
    </summary>
    <div className="space-y-3 py-3">
      <p className="text-sm">
        Sem resposta é diferente de não ter percebido impulsos.
      </p>
      {entry.impulsiveBehaviors.map((impulse) => (
        <div key={impulse.id} className="border rounded-lg p-3 space-y-2">
          <label>
            O que percebeu?
            <input
              className={fieldClass}
              value={impulse.type}
              onChange={(event) =>
                onImpulseChange(impulse.id, { type: event.target.value })
              }
            />
          </label>
          <label>
            Intensidade percebida (1 a 5)
            <input
              className={fieldClass}
              type="number"
              min="1"
              max="5"
              value={impulse.intensity ?? ''}
              onChange={(event) =>
                onImpulseChange(impulse.id, {
                  intensity:
                    event.target.value === ''
                      ? null
                      : Number(event.target.value),
                })
              }
            />
          </label>
          <label>
            O que aconteceu?
            <select
              className={fieldClass}
              value={impulse.outcome ?? ''}
              onChange={(event) =>
                onImpulseChange(impulse.id, {
                  outcome: (event.target.value ||
                    undefined) as ImpulsiveBehavior['outcome'],
                })
              }
            >
              <option value="">
                Não informado
                {impulse.resisted ? ' (desfecho antigo preservado)' : ''}
              </option>
              {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estratégia escolhida (opcional)
            <input
              className={fieldClass}
              value={impulse.copingUsed ?? ''}
              onChange={(event) =>
                onImpulseChange(impulse.id, {
                  copingUsed: event.target.value,
                })
              }
            />
          </label>
          <button
            type="button"
            className={buttonClass}
            aria-label="Remover impulso"
            onClick={() =>
              onChange({
                impulsiveBehaviors: entry.impulsiveBehaviors.filter(
                  (value) => value.id !== impulse.id,
                ),
                observedSections: entry.observedSections?.filter(
                  (section) => section !== 'impulses',
                ),
              })
            }
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            onObservedChange('impulses', {
              impulsiveBehaviors: [
                ...entry.impulsiveBehaviors,
                {
                  id: crypto.randomUUID(),
                  type: '',
                  intensity: null,
                },
              ],
            })
          }
        >
          Adicionar impulso
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            onObservedChange('impulses', { impulsiveBehaviors: [] })
          }
        >
          Não percebi impulsos
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            onChange({
              impulsiveBehaviors: [],
              observedSections: entry.observedSections?.filter(
                (section) => section !== 'impulses',
              ),
            })
          }
        >
          Deixar impulsos sem resposta
        </button>
      </div>
      <p role="status" className="text-sm">
        {entry.impulsiveBehaviors.length
          ? `${entry.impulsiveBehaviors.length} ocorrência(s)`
          : entry.observedSections?.includes('impulses')
            ? 'Resposta: não percebi impulsos.'
            : 'Impulsos não informados.'}
      </p>
    </div>
  </details>
);

interface ActivitySectionProps {
  entry: AfetivoEntry;
  onChange: EntryChange;
  onObservedChange: ObservedChange;
  onWorkoutChange: (index: number, patch: Partial<PhysicalActivity>) => void;
}

export const ActivitySection: React.FC<ActivitySectionProps> = ({
  entry,
  onChange,
  onObservedChange,
  onWorkoutChange,
}) => (
  <details>
    <summary className="cursor-pointer font-semibold py-2">
      Atividade física
    </summary>
    <div className="space-y-3 py-3">
      {(entry.physicalActivities ?? []).map((activity, index) => (
        <div key={index} className="border rounded-lg p-3 space-y-2">
          <label>
            Atividade
            <input
              className={fieldClass}
              value={activity.type}
              onChange={(event) =>
                onWorkoutChange(index, { type: event.target.value })
              }
            />
          </label>
          <label>
            Duração em minutos
            <input
              className={fieldClass}
              type="number"
              min="1"
              max="1440"
              value={activity.durationMinutes ?? ''}
              onChange={(event) =>
                onWorkoutChange(index, {
                  durationMinutes:
                    event.target.value === ''
                      ? null
                      : Number(event.target.value),
                })
              }
            />
          </label>
          <label>
            Intensidade
            <select
              className={fieldClass}
              value={activity.intensity ?? ''}
              onChange={(event) =>
                onWorkoutChange(index, {
                  intensity: (event.target.value ||
                    null) as PhysicalActivity['intensity'],
                })
              }
            >
              <option value="">Não informada</option>
              <option value="light">Leve</option>
              <option value="moderate">Moderada</option>
              <option value="vigorous">Intensa</option>
            </select>
          </label>
          <button
            type="button"
            className={buttonClass}
            aria-label="Remover atividade"
            onClick={() =>
              onChange({
                physicalActivities: (entry.physicalActivities ?? []).filter(
                  (_, activityIndex) => activityIndex !== index,
                ),
                observedSections: entry.observedSections?.filter(
                  (section) => section !== 'activities',
                ),
              })
            }
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      <button
        type="button"
        className={buttonClass}
        onClick={() =>
          onObservedChange('activities', {
            physicalActivities: [
              ...(entry.physicalActivities ?? []),
              {
                id: crypto.randomUUID(),
                type: '',
                durationMinutes: null,
                intensity: null,
              },
            ],
          })
        }
      >
        Adicionar atividade
      </button>
    </div>
  </details>
);

interface MedicationSectionProps {
  entry: AfetivoEntry;
  medications: Medication[];
  onObservedChange: ObservedChange;
}

export const MedicationSection: React.FC<MedicationSectionProps> = ({
  entry,
  medications,
  onObservedChange,
}) => {
  const historicalMedications = entry.medicationIntakes
    .filter(
      (intake) =>
        !medications.some((medication) => medication.id === intake.medicationId),
    )
    .map((intake) => ({
      id: intake.medicationId,
      name: intake.medicationName,
      active: false,
    }));
  const shownMedications = [
    ...medications.filter(
      (medication) =>
        medication.active ||
        entry.medicationIntakes.some(
          (intake) => intake.medicationId === medication.id,
        ),
    ),
    ...historicalMedications,
  ];

  return (
    <details>
      <summary className="cursor-pointer font-semibold py-2">
        Medicações e rotina
      </summary>
      <div className="space-y-3 py-3">
        <p className="text-sm">
          Nenhum item é marcado automaticamente. Registre apenas o que sabe; o
          diário não sugere doses.
        </p>
        {shownMedications.map((medication) => (
          <label key={medication.id} className="block">
            {medication.name}
            {!medication.active ? ' (histórico / pausado)' : ''}
            <select
              aria-label={`Uso de ${medication.name}`}
              className={fieldClass}
              value={
                entry.medicationIntakes.find(
                  (intake) => intake.medicationId === medication.id,
                )?.status ?? ''
              }
              onChange={(event) =>
                onObservedChange('medications', {
                  medicationIntakes: [
                    ...entry.medicationIntakes.filter(
                      (intake) => intake.medicationId !== medication.id,
                    ),
                    ...(event.target.value
                      ? [
                          {
                            ...entry.medicationIntakes.find(
                              (intake) =>
                                intake.medicationId === medication.id,
                            ),
                            medicationId: medication.id,
                            medicationName: medication.name,
                            status: event.target
                              .value as AfetivoEntry['medicationIntakes'][number]['status'],
                          },
                        ]
                      : []),
                  ],
                })
              }
            >
              <option value="">Não informado</option>
              <option value="taken">Tomado / realizado</option>
              <option value="skipped">Não tomado / realizado</option>
              <option value="delayed">Atrasado</option>
              <option value="extra_dose">Dose adicional já utilizada</option>
            </select>
          </label>
        ))}
        {!shownMedications.length && <p>Nenhum item ativo cadastrado.</p>}
      </div>
    </details>
  );
};
