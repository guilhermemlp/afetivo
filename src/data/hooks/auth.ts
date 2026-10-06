import { useMutation } from '@tanstack/react-query';
import { AuthError, getAuthApi } from '@/data/auth';

function requireAuthApi() {
  const api = getAuthApi();
  if (!api) {
    throw new AuthError('remote_not_configured', 'Sincronização não configurada neste ambiente.');
  }
  return api;
}

/** Envia o magic link de acesso por e-mail (sem senha). */
export function useSendMagicLink() {
  return useMutation({
    mutationFn: (email: string) => requireAuthApi().sendMagicLink(email.trim()),
  });
}

/** Encerra a sessão; sem env é apenas um no-op. */
export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      const api = getAuthApi();
      if (!api) return;
      await api.signOut();
    },
  });
}
