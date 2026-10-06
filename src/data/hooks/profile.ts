import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserProfile } from '@/core/profile';
import { getAppStore } from '@/data/appStore';
import { notifyLocalChange } from '@/data/sync/runtime';
import { queryKeys } from './queryKeys';

/** Perfil local (nome de exibição, notas, preferências). */
export function useProfile(): { profile: UserProfile | null; isLoading: boolean } {
  const store = getAppStore();
  const query = useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => store.profile.get(),
  });
  return { profile: query.data ?? null, isLoading: query.isLoading };
}

export function useUpdateProfile() {
  const store = getAppStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      await store.profile.put(profile);
      notifyLocalChange();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}
