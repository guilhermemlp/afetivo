import type { RemoteClient, RemoteRecord, SyncError } from '@/data/remote/types';
import type { SyncCollection } from '@/data/sync/types';

/**
 * Remoto falso para testes do motor de sync: emula o servidor com merge
 * LWW (registro mais antigo é ignorado), falhas injetáveis e um gatilho
 * `beforePull` para simular edição local durante o pull.
 */
export class FakeRemote implements RemoteClient {
  readonly rows = new Map<SyncCollection, Map<string, RemoteRecord>>();
  pushCalls = 0;
  pullCalls = 0;
  pushedRows = 0;
  pulledRows = 0;
  failNextPush: SyncError | null = null;
  failNextPull: SyncError | null = null;
  /** Coleções cujo push é silenciosamente descartado (LWW do servidor). */
  readonly dropPushFor = new Set<SyncCollection>();
  beforePull: ((collection: SyncCollection) => void | Promise<void>) | null = null;

  private table(collection: SyncCollection): Map<string, RemoteRecord> {
    let table = this.rows.get(collection);
    if (!table) {
      table = new Map();
      this.rows.set(collection, table);
    }
    return table;
  }

  async putMany(collection: SyncCollection, rows: RemoteRecord[]): Promise<void> {
    this.pushCalls += 1;
    if (this.failNextPush) {
      const error = this.failNextPush;
      this.failNextPush = null;
      throw error;
    }
    if (this.dropPushFor.has(collection)) return;
    const table = this.table(collection);
    for (const row of rows) {
      const existing = table.get(row.id);
      if (existing && existing.updatedAt > row.updatedAt) continue;
      table.set(row.id, row);
    }
    this.pushedRows += rows.length;
  }

  async pullSince(collection: SyncCollection, since: number): Promise<RemoteRecord[]> {
    this.pullCalls += 1;
    if (this.failNextPull) {
      const error = this.failNextPull;
      this.failNextPull = null;
      throw error;
    }
    await this.beforePull?.(collection);
    const rows = [...this.table(collection).values()].filter((row) => row.updatedAt > since);
    this.pulledRows += rows.length;
    return rows;
  }

  /** Insere/substitui uma linha sem passar pelo merge (estado do servidor). */
  seed(collection: SyncCollection, record: RemoteRecord): void {
    this.table(collection).set(record.id, record);
  }

  get(collection: SyncCollection, id: string): RemoteRecord | undefined {
    return this.table(collection).get(id);
  }
}
