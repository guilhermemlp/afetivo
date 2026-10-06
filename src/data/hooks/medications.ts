import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Medication, MedicationEvent } from '@/core/medication';
import { getAppStore } from '@/data/appStore';
import { notifyLocalChange } from '@/data/sync/runtime';
import { queryKeys } from './queryKeys';

/** Catálogo: ativas primeiro, depois ordem alfabética. */
export function useMedications(): { medications: Medication[]; isLoading: boolean } {
  const store = getAppStore();
  const query = useQuery({
    queryKey: queryKeys.medications,
    queryFn: () => store.medications.list(),
  });
  const medications = useMemo(
    () =>
      [...(query.data ?? [])].sort(
        (a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'pt-BR'),
      ),
    [query.data],
  );
  return { medications, isLoading: query.isLoading };
}

/** Eventos do mais recente para o mais antigo (data + horário). */
export function useMedicationEvents(): { events: MedicationEvent[]; isLoading: boolean } {
  const store = getAppStore();
  const query = useQuery({
    queryKey: queryKeys.medicationEvents,
    queryFn: () => store.medicationEvents.list(),
  });
  const events = useMemo(() => sortEventsDesc(query.data ?? []), [query.data]);
  return { events, isLoading: query.isLoading };
}

export function sortEventsDesc(events: MedicationEvent[]): MedicationEvent[] {
  return [...events].sort(
    (a, b) =>
      `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`) || b.createdAt - a.createdAt,
  );
}

/** Upsert de medicação (criação e edição usam o mesmo caminho). */
export function useSaveMedication() {
  const store = getAppStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (medication: Medication) => {
      await store.medications.put(medication);
      notifyLocalChange();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.medications });
    },
  });
}

/**
 * Exclusão de medicação do catálogo. Os eventos já registrados ficam no
 * histórico (cada evento carrega o nome da época).
 */
export function useDeleteMedication() {
  const store = getAppStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await store.medications.delete(id);
      notifyLocalChange();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.medications });
    },
  });
}

export function useSaveMedicationEvent() {
  const store = getAppStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: MedicationEvent) => {
      await store.medicationEvents.put(event);
      notifyLocalChange();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.medicationEvents });
    },
  });
}

export function useDeleteMedicationEvent() {
  const store = getAppStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await store.medicationEvents.delete(id);
      notifyLocalChange();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.medicationEvents });
    },
  });
}
