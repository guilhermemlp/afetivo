import { parseEntry } from '@/core/entry';
import { parseMedication, parseMedicationEvent } from '@/core/medication';
import { parseProfile, PROFILE_ID, type UserProfile } from '@/core/profile';
import { parseAssessment, parseWarningSign } from '@/core/tracking';
import type { RemoteClient, RemoteRecord } from '@/data/remote/types';
import type { AfetivoStore, Collection } from '@/data/store';
import type { SyncStateStore } from './state';
import { SYNC_COLLECTIONS, SYNC_OVERLAP_MS, tombstoneId, type SyncCollection } from './types';

/** Todo item sincronizado carrega a versão usada no merge LWW. */
interface Syncable {
  id: string;
  updatedAt: number;
}

export interface SyncDeps {
  store: AfetivoStore;
  remote: RemoteClient;
  state: SyncStateStore;
  now?: () => number;
}

export interface SyncResult {
  /** Registros locais enviados nesta execução. */
  pushed: number;
  /** Exclusões locais propagadas ao servidor. */
  tombstonesPushed: number;
  /** Registros remotos aplicados localmente. */
  merged: number;
  /** Exclusões remotas aplicadas localmente. */
  deleted: number;
  /** Registros remotos descartados por payload inválido. */
  skipped: number;
}

const PARSERS: Record<SyncCollection, (value: unknown) => Syncable> = {
  entries: (value) => parseEntry(value),
  medications: (value) => parseMedication(value),
  medicationEvents: (value) => parseMedicationEvent(value),
  warningSigns: (value) => parseWarningSign(value),
  assessments: (value) => parseAssessment(value),
  profile: (value) => parseProfile(value),
};

function profileAsCollection(profile: AfetivoStore['profile']): Collection<Syncable> {
  return {
    async list() {
      return [await profile.get()];
    },
    async get(id) {
      return id === PROFILE_ID ? await profile.get() : null;
    },
    async put(item) {
      await profile.put(item as UserProfile);
    },
    async putMany(items) {
      for (const item of items) await profile.put(item as UserProfile);
    },
    // O perfil é sempre um documento só: não é apagável nem limpável.
    async delete() {},
    async deleteRaw() {},
    async clear() {},
  };
}

function collectionOf(store: AfetivoStore, collection: SyncCollection): Collection<Syncable> {
  if (collection === 'profile') return profileAsCollection(store.profile);
  return store[collection] as unknown as Collection<Syncable>;
}

/**
 * Uma execução completa de sync (push → pull) com cursores LWW.
 *
 * Regras:
 * - o cursor persistido já embute a sobreposição (`start - 1s`), então push e
 *   pull leem a partir dele direto; releitura perto da borda é idempotente;
 * - push: itens com `updatedAt` além do cursor, e todos os tombstones
 *   (sempre — o upsert remoto é idempotente);
 * - pull: `updated_at` além do cursor; conflitos decidem por LWW (mais novo
 *   vence; empate mantém o local);
 * - tombstone local mais novo que o registro remoto respeita a exclusão;
 *   mais antigo é descartado e o registro volta (convergência em 2 saltos);
 * - cursores só avançam quando push **e** pull terminam com sucesso.
 */
export async function syncOnce(deps: SyncDeps): Promise<SyncResult> {
  const { store, remote, state } = deps;
  const now = deps.now ?? Date.now;
  const startedAt = now();
  const cursors = await state.get();
  const result: SyncResult = {
    pushed: 0,
    tombstonesPushed: 0,
    merged: 0,
    deleted: 0,
    skipped: 0,
  };

  const pushSince = cursors.pushCursor;
  for (const collection of SYNC_COLLECTIONS) {
    const items = await collectionOf(store, collection).list();
    const rows: RemoteRecord[] = items
      .filter((item) => item.updatedAt > pushSince)
      .map((item) => ({ id: item.id, updatedAt: item.updatedAt, deletedAt: null, data: item }));
    if (rows.length === 0) continue;
    await remote.putMany(collection, rows);
    result.pushed += rows.length;
  }

  const tombstones = await store.tombstones.list();
  if (tombstones.length > 0) {
    const byCollection = new Map<SyncCollection, RemoteRecord[]>();
    for (const tombstone of tombstones) {
      const rows = byCollection.get(tombstone.collection) ?? [];
      rows.push({
        id: tombstone.targetId,
        updatedAt: tombstone.deletedAt,
        deletedAt: tombstone.deletedAt,
        data: null,
      });
      byCollection.set(tombstone.collection, rows);
    }
    for (const [collection, rows] of byCollection) {
      await remote.putMany(collection, rows);
    }
    // Push confirmado: as exclusões já existem no servidor, não precisa
    // reenviar — o servidor faz o papel de lembrança definitiva.
    await store.tombstones.clear();
    result.tombstonesPushed = tombstones.length;
  }

  const pullSince = cursors.pullCursor;
  for (const collection of SYNC_COLLECTIONS) {
    const col = collectionOf(store, collection);
    const parser = PARSERS[collection];
    for (const row of await remote.pullSince(collection, pullSince)) {
      if (row.deletedAt !== null || row.data === null) {
        const local = await col.get(row.id);
        // Versão local mais nova que a exclusão remota: o local vence.
        if (local && local.updatedAt > row.updatedAt) continue;
        if (local) {
          await col.deleteRaw(row.id);
          result.deleted += 1;
        }
        await store.tombstones.delete(tombstoneId(collection, row.id));
        continue;
      }

      let parsed: Syncable;
      try {
        parsed = parser(row.data);
      } catch {
        result.skipped += 1;
        continue;
      }

      const local = await col.get(row.id);
      if (!local) {
        const tombstone = await store.tombstones.get(tombstoneId(collection, row.id));
        if (tombstone && tombstone.deletedAt >= row.updatedAt) continue;
        if (tombstone) await store.tombstones.delete(tombstone.id);
        await col.put(parsed);
        result.merged += 1;
        continue;
      }
      if (row.updatedAt > local.updatedAt) {
        await col.put(parsed);
        result.merged += 1;
      }
    }
  }

  const cursor = startedAt - SYNC_OVERLAP_MS;
  await state.set({ pushCursor: cursor, pullCursor: cursor });
  return result;
}
