import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Entry } from '@/core/entry';
import { sortEntriesDesc } from '@/core/order';
import { getAppStore } from '@/data/appStore';
import { notifyLocalChange } from '@/data/sync/runtime';
import { queryKeys } from './queryKeys';

/** Lista completa de registros, ordenada do mais recente para o mais antigo. */
export function useEntries(): {
  entries: Entry[];
  isLoading: boolean;
  isError: boolean;
} {
  const store = getAppStore();
  const query = useQuery({
    queryKey: queryKeys.entries,
    queryFn: () => store.entries.list(),
  });
  const entries = useMemo(() => sortEntriesDesc(query.data ?? []), [query.data]);
  return { entries, isLoading: query.isLoading, isError: query.isError };
}

/**
 * Cria **ou** atualiza um registro (upsert pelo id). Toda escrita local
 * avisa o runtime de sync para propagar ao servidor quando disponível.
 */
export function useSaveEntry() {
  const store = getAppStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Entry) => {
      await store.entries.put(entry);
      notifyLocalChange();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.entries });
    },
  });
}

/** Exclusão local (grava tombstone para propagar aos outros dispositivos). */
export function useDeleteEntry() {
  const store = getAppStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await store.entries.delete(id);
      notifyLocalChange();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.entries });
    },
  });
}
