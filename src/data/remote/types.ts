import type { SyncCollection } from '@/data/sync/types';

/**
 * Classificação dos erros de sync: o runtime decide o que silenciar
 * (offline e sessão ausente são esperados, nunca são erro fatal).
 */
export type SyncErrorKind = 'unauthenticated' | 'network' | 'unknown';

export class SyncError extends Error {
  readonly kind: SyncErrorKind;

  constructor(kind: SyncErrorKind, message: string) {
    super(message);
    this.name = 'SyncError';
    this.kind = kind;
  }
}

/** Converte qualquer erro (inclusive rejeições de fetch) em `SyncError`. */
export function toSyncError(error: unknown): SyncError {
  if (error instanceof SyncError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/failed to fetch|networkerror|fetch failed|load failed|econn|timeout/i.test(message)) {
    return new SyncError('network', message);
  }
  if (/jwt|row-level security|permission denied|not authenticated|\b40[13]\b/i.test(message)) {
    return new SyncError('unauthenticated', message);
  }
  return new SyncError('unknown', message);
}

/** Linha do servidor: `data` nulo marca tombstone (exclusão propagada). */
export interface RemoteRecord {
  readonly id: string;
  /** Versão do registro em epoch ms — base do merge LWW. */
  readonly updatedAt: number;
  /** Época da exclusão; `null` = registro vivo. */
  readonly deletedAt: number | null;
  /** Payload já validado pelo Zod no cliente; `null` em tombstone. */
  readonly data: unknown | null;
}

/** Abstração do backend usada pelo motor de sync (fácil de trocar/testar). */
export interface RemoteClient {
  putMany(collection: SyncCollection, rows: RemoteRecord[]): Promise<void>;
  pullSince(collection: SyncCollection, since: number): Promise<RemoteRecord[]>;
}
