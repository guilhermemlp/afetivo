import { useState } from 'react';
import { formatDateBR, localDate } from '@/core/dates';
import {
  INTAKE_STATUS_LABELS,
  MEDICATION_CATEGORY_LABELS,
  MEDICATION_EVENT_KIND_LABELS,
  MEDICATION_FREQUENCY_LABELS,
} from '@/core/labels';
import { createMedicationEvent, type Medication, type MedicationEvent } from '@/core/medication';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import {
  useDeleteMedication,
  useDeleteMedicationEvent,
  useMedicationEvents,
  useMedications,
  useSaveMedicationEvent,
} from '@/data/hooks';
import { MedicationEventModal } from './MedicationEventModal';
import { MedicationFormModal } from './MedicationFormModal';

type MedFormState = { medication: Medication | null };
type EventFormState =
  { mode: 'create'; medication: Medication } | { mode: 'edit'; event: MedicationEvent };

/**
 * Medicações: catálogo com tomada em um clique, eventos dose a dose
 * (ajuste, pausa, efeito colateral) e histórico que sobrevive à exclusão
 * da medicação — cada evento guarda o nome da época.
 */
export function MedicationsPage() {
  const { medications, isLoading: medsLoading } = useMedications();
  const { events, isLoading: eventsLoading } = useMedicationEvents();
  const saveEvent = useSaveMedicationEvent();
  const deleteMedication = useDeleteMedication();
  const deleteEvent = useDeleteMedicationEvent();

  const [medForm, setMedForm] = useState<MedFormState | null>(null);
  const [eventForm, setEventForm] = useState<EventFormState | null>(null);
  const [confirmMedId, setConfirmMedId] = useState<string | null>(null);
  const [confirmEventId, setConfirmEventId] = useState<string | null>(null);

  const today = localDate(new Date());
  const todayIntakes = events.filter((event) => event.date === today && event.kind === 'intake');

  function quickIntake(medication: Medication): void {
    saveEvent.mutate(
      createMedicationEvent({
        medicationId: medication.id,
        medicationName: medication.name,
        kind: 'intake',
        dose: medication.dosage === '' ? null : medication.dosage,
        status: 'taken',
      }),
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Medicações</h1>
        <Button onClick={() => setMedForm({ medication: null })}>Adicionar medicação</Button>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Tomadas de hoje</h2>
        {eventsLoading ? (
          <Skeleton className="mt-3" size="h-16 w-full" />
        ) : todayIntakes.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            Nenhuma tomada registrada hoje. Use o botão “Tomada” da lista abaixo para registrar em
            um toque.
          </p>
        ) : (
          <ul
            className="mt-3 divide-y divide-edge rounded-xl border border-edge"
            aria-label="Tomadas de hoje"
          >
            {todayIntakes.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium tabular-nums">{event.time}</span> ·{' '}
                  {event.medicationName}
                  {event.dose && <span className="text-ink-muted"> · {event.dose}</span>}
                </span>
                <span className="text-ink-muted">
                  {event.status ? INTAKE_STATUS_LABELS[event.status] : 'Situação não informada'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Catálogo</h2>
        {medsLoading ? (
          <Skeleton className="mt-3" size="h-24 w-full" />
        ) : medications.length === 0 ? (
          <EmptyState
            title="Nenhuma medicação cadastrada"
            description="Cadastre para acompanhar cada tomada, ajuste de dose e efeito colateral."
            action={
              <Button onClick={() => setMedForm({ medication: null })}>Adicionar medicação</Button>
            }
          />
        ) : (
          <ul
            className="mt-3 divide-y divide-edge rounded-xl border border-edge"
            aria-label="Medicações cadastradas"
          >
            {medications.map((medication) => (
              <li key={medication.id} className="px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {medication.name}
                      {!medication.active && (
                        <span className="ml-2 rounded-full bg-panel-2 px-2 py-0.5 text-xs font-normal text-ink-muted">
                          Inativa
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {MEDICATION_CATEGORY_LABELS[medication.category]}
                      {' · '}
                      {medication.dosage === '' ? 'sem dose informada' : medication.dosage}
                      {' · '}
                      {MEDICATION_FREQUENCY_LABELS[medication.frequency]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => quickIntake(medication)}
                      loading={saveEvent.isPending}
                    >
                      Tomada
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEventForm({ mode: 'create', medication })}
                    >
                      Evento
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setMedForm({ medication })}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (confirmMedId === medication.id) {
                          deleteMedication.mutate(medication.id);
                          setConfirmMedId(null);
                        } else {
                          setConfirmMedId(medication.id);
                        }
                      }}
                    >
                      {confirmMedId === medication.id ? 'Confirmar exclusão' : 'Excluir'}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Histórico de eventos</h2>
        {eventsLoading ? (
          <Skeleton className="mt-3" size="h-24 w-full" />
        ) : events.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            Nenhum evento ainda — tomadas, ajustes e efeitos colaterais aparecem aqui.
          </p>
        ) : (
          <ul
            className="mt-3 divide-y divide-edge rounded-xl border border-edge"
            aria-label="Eventos registrados"
          >
            {events.slice(0, 30).map((event) => (
              <li key={event.id} className="px-3 py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p>
                    <span className="font-medium tabular-nums">
                      {formatDateBR(event.date)} {event.time}
                    </span>
                    <span className="text-ink-muted">
                      {' '}
                      · {MEDICATION_EVENT_KIND_LABELS[event.kind]} · {event.medicationName}
                      {event.dose && ` · ${event.dose}`}
                      {event.kind === 'intake' && event.status
                        ? ` · ${INTAKE_STATUS_LABELS[event.status]}`
                        : ''}
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEventForm({ mode: 'edit', event })}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (confirmEventId === event.id) {
                          deleteEvent.mutate(event.id);
                          setConfirmEventId(null);
                        } else {
                          setConfirmEventId(event.id);
                        }
                      }}
                    >
                      {confirmEventId === event.id ? 'Confirmar exclusão' : 'Excluir'}
                    </Button>
                  </div>
                </div>
                {event.sideEffects.length > 0 && (
                  <p className="mt-1 text-ink-muted">Efeitos: {event.sideEffects.join(', ')}</p>
                )}
                {event.notes && <p className="mt-1 text-ink-muted">{event.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {medForm && (
        <MedicationFormModal
          medication={medForm.medication ?? undefined}
          onClose={() => setMedForm(null)}
        />
      )}
      {eventForm?.mode === 'create' && (
        <MedicationEventModal
          medication={eventForm.medication}
          onClose={() => setEventForm(null)}
        />
      )}
      {eventForm?.mode === 'edit' && (
        <MedicationEventModal event={eventForm.event} onClose={() => setEventForm(null)} />
      )}
    </section>
  );
}
