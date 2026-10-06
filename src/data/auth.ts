import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { appEnv } from '@/core/env';

export type AuthErrorKind =
  'remote_not_configured' | 'invalid_email' | 'rate_limited' | 'network' | 'unknown';

export class AuthError extends Error {
  readonly kind: AuthErrorKind;

  constructor(kind: AuthErrorKind, message: string) {
    super(message);
    this.name = 'AuthError';
    this.kind = kind;
  }
}

interface ErrorLike {
  message?: string;
}

function classifyAuthError(error: ErrorLike): AuthError {
  const message = error.message ?? 'Erro ao enviar o link.';
  if (/rate limit|too many/i.test(message)) return new AuthError('rate_limited', message);
  if (/failed to fetch|networkerror|fetch failed/i.test(message)) {
    return new AuthError('network', message);
  }
  if (/email|invalid/i.test(message)) return new AuthError('invalid_email', message);
  return new AuthError('unknown', message);
}

/**
 * Superfície mínima do cliente Supabase usada pelo app — mantém `auth.ts`
 * testável sem depender da implementação real da SDK.
 */
export interface AuthClient {
  auth: {
    signInWithOtp(options: {
      email: string;
      options?: { emailRedirectTo?: string };
    }): Promise<{ error: ErrorLike | null }>;
    signOut(): Promise<{ error: ErrorLike | null }>;
    getSession(): Promise<{ data: { session: Session | null } }>;
    onAuthStateChange(callback: (event: string, session: Session | null) => void): {
      data: { subscription: { unsubscribe(): void } };
    };
  };
}

export interface AuthApi {
  /** Envia o magic link por e-mail (login sem senha). */
  sendMagicLink(email: string, redirectTo?: string): Promise<void>;
  signOut(): Promise<void>;
  currentSession(): Promise<Session | null>;
  /** Retorna a função que cancela a assinatura. */
  onAuthChange(callback: (session: Session | null) => void): () => void;
}

function defaultRedirect(): string | undefined {
  return typeof window === 'undefined' ? undefined : window.location.origin;
}

export function createAuthApi(client: AuthClient): AuthApi {
  return {
    async sendMagicLink(email, redirectTo) {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo ?? defaultRedirect() },
      });
      if (error) throw classifyAuthError(error);
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw classifyAuthError(error);
    },
    async currentSession() {
      const { data } = await client.auth.getSession();
      return data.session ?? null;
    },
    onAuthChange(callback) {
      const { data } = client.auth.onAuthStateChange((_event, session) => callback(session));
      return () => data.subscription.unsubscribe();
    },
  };
}

let cached: SupabaseClient | null | undefined;

/**
 * Cliente único do Supabase. Sem env o app é 100% local e isto retorna
 * `null` — login e sync ficam indisponíveis, nunca quebram a tela.
 */
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const env = appEnv();
  if (!env.remoteEnabled || !env.supabaseUrl || !env.supabaseAnonKey) {
    cached = null;
    return cached;
  }
  cached = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return cached;
}

/** API de autenticação ou `null` em modo local puro. */
export function getAuthApi(): AuthApi | null {
  const supabase = getSupabase();
  return supabase ? createAuthApi(supabase) : null;
}

/** Testes: força nova criação do cliente após trocar o env. */
export function resetSupabase(): void {
  cached = undefined;
}
