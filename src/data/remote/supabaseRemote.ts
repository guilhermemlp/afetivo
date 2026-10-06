import type { SupabaseClient } from '@supabase/supabase-js';
import type { SyncCollection } from '@/data/sync/types';
import { SyncError, toSyncError, type RemoteClient, type RemoteRecord } from './types';

/** Nome das tabelas por coleção (snake_case no Postgres). */
export const REMOTE_TABLES: Record<SyncCollection, string> = {
  entries: 'entries',
  medications: 'medications',
  medicationEvents: 'medication_events',
  warningSigns: 'warning_signs',
  assessments: 'assessments',
  profile: 'profiles',
};

/** Tamanho das páginas de pull e dos lotes de upsert (limite do PostgREST). */
const PAGE_SIZE = 1000;
const UPSERT_CHUNK = 500;

export function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

interface ServerRow {
  id?: unknown;
  data?: unknown;
  updated_at?: unknown;
  deleted_at?: unknown;
}

/** Converte linha vinda do PostgREST; retorno `null` descarta linha inválida. */
export function fromServerRow(row: unknown): RemoteRecord | null {
  if (row === null || typeof row !== 'object') return null;
  const raw = row as ServerRow;
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null;
  const updatedAt = typeof raw.updated_at === 'string' ? Date.parse(raw.updated_at) : NaN;
  if (!Number.isFinite(updatedAt)) return null;
  const deletedAt =
    typeof raw.deleted_at === 'string' && raw.deleted_at.length > 0
      ? Date.parse(raw.deleted_at)
      : null;
  if (deletedAt !== null && !Number.isFinite(deletedAt)) return null;
  return {
    id: raw.id,
    updatedAt,
    deletedAt,
    data: raw.data ?? null,
  };
}

interface SupabaseErrorLike {
  message?: string;
  code?: string;
}

function classify(error: SupabaseErrorLike | null | undefined): SyncError {
  const message = error?.message ?? 'Erro desconhecido no servidor.';
  const code = error?.code ?? '';
  if (code === '401' || code === '403' || code === 'PGRST301' || code === 'PGRST302') {
    return new SyncError('unauthenticated', message);
  }
  return toSyncError(new Error(message));
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

/**
 * Implementação Supabase do contrato remoto.
 *
 * Pull é paginado (1000/página, ordenado por `updated_at` e `id` para
 * desempate estável); push vai em lotes de 500 com `user_id` explícito da
 * sessão — RLS no servidor é a garantia, nunca o cliente.
 */
export function createSupabaseRemote(client: SupabaseClient): RemoteClient {
  return {
    async putMany(collection, rows) {
      if (rows.length === 0) return;
      const { data, error } = await client.auth.getSession();
      if (error) throw classify(error);
      const userId = data.session?.user.id;
      if (!userId) throw new SyncError('unauthenticated', 'Sessão ausente.');

      const table = REMOTE_TABLES[collection];
      for (const part of chunk(rows, UPSERT_CHUNK)) {
        const payload = part.map((row) => ({
          user_id: userId,
          id: row.id,
          data: row.data,
          updated_at: toIso(row.updatedAt),
          deleted_at: row.deletedAt === null ? null : toIso(row.deletedAt),
        }));
        try {
          const result = await client.from(table).upsert(payload, { onConflict: 'user_id,id' });
          if (result.error) throw classify(result.error);
        } catch (error) {
          throw toSyncError(error);
        }
      }
    },

    async pullSince(collection, since) {
      const table = REMOTE_TABLES[collection];
      const records: RemoteRecord[] = [];
      let offset = 0;
      for (;;) {
        let data: unknown[] | null;
        let error: SupabaseErrorLike | null;
        try {
          const result = await client
            .from(table)
            .select('id, data, updated_at, deleted_at')
            .gt('updated_at', toIso(since))
            .order('updated_at', { ascending: true })
            .order('id', { ascending: true })
            .range(offset, offset + PAGE_SIZE - 1);
          data = result.data;
          error = result.error;
        } catch (caught) {
          throw toSyncError(caught);
        }
        if (error) throw classify(error);
        const page = Array.isArray(data) ? data : [];
        for (const row of page) {
          const record = fromServerRow(row);
          if (record) records.push(record);
        }
        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }
      return records;
    },
  };
}
