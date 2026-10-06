/** Coleções que participam do sync (espelham as tabelas do Postgres). */
export const SYNC_COLLECTIONS = [
  'entries',
  'medications',
  'medicationEvents',
  'warningSigns',
  'assessments',
  'profile',
] as const;
export type SyncCollection = (typeof SYNC_COLLECTIONS)[number];

/**
 * Margem gravada no cursor a cada sync (`start - 1s`): refaz push/pull perto
 * da borda para nunca perder mudança feita em paralelo; o merge LWW torna a
 * releitura idempotente.
 */
export const SYNC_OVERLAP_MS = 1000;

/**
 * Exclusão local pendente de propagação. `id` é estável
 * (`coleção:registro`) para que o push seja idempotente.
 */
export interface Tombstone {
  readonly id: string;
  readonly collection: SyncCollection;
  readonly targetId: string;
  readonly deletedAt: number;
}

export function tombstoneId(collection: SyncCollection, targetId: string): string {
  return `${collection}:${targetId}`;
}

export function makeTombstone(
  collection: SyncCollection,
  targetId: string,
  deletedAt = Date.now(),
): Tombstone {
  return { id: tombstoneId(collection, targetId), collection, targetId, deletedAt };
}

/** Cursores de sync persistidos localmente (epoch ms). */
export interface SyncState {
  readonly pushCursor: number;
  readonly pullCursor: number;
}

export function initialSyncState(): SyncState {
  return { pushCursor: 0, pullCursor: 0 };
}
