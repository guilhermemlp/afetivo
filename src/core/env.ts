import { z } from 'zod';

/**
 * Configuração de ambiente validada no boot.
 *
 * Sem env (dev local, preview, build sem segredos) o app roda 100% local:
 * sync e login simplesmente ficam indisponíveis — nunca é erro fatal.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.url('VITE_SUPABASE_URL precisa ser uma URL').optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export interface AppEnv {
  /** `null` = backend remoto não configurado (modo local puro). */
  readonly supabaseUrl: string | null;
  readonly supabaseAnonKey: string | null;
  readonly remoteEnabled: boolean;
  /** Problemas de configuração para exibir em Ajustes (nunca derruba o app). */
  readonly issues: readonly string[];
}

function toAppEnv(raw: unknown): AppEnv {
  // `.env` com chave vazia (`VITE_SUPABASE_URL=`) é ausência, não erro.
  const source: Record<string, unknown> = {};
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === 'string' && value.trim() === '') continue;
      source[key] = value;
    }
  }

  const parsed = envSchema.safeParse(source);
  const issues: string[] = [];

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push(issue.message);
    }
    return { supabaseUrl: null, supabaseAnonKey: null, remoteEnabled: false, issues };
  }

  const url = parsed.data.VITE_SUPABASE_URL ?? null;
  const anonKey = parsed.data.VITE_SUPABASE_ANON_KEY ?? null;

  if ((url && !anonKey) || (!url && anonKey)) {
    issues.push('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam ser definidas juntas.');
  }

  const remoteEnabled = Boolean(url && anonKey);
  return { supabaseUrl: url, supabaseAnonKey: anonKey, remoteEnabled, issues };
}

let cached: AppEnv | null = null;

/** Lê `import.meta.env` uma única vez (memoizado). */
export function appEnv(raw: unknown = import.meta.env): AppEnv {
  cached ??= toAppEnv(raw);
  return cached;
}

/** Testes: força nova leitura com outro payload. */
export function resetAppEnv(): void {
  cached = null;
}

export { toAppEnv as parseAppEnv };
