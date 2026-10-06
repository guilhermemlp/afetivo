import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createSupabaseRemote,
  fromServerRow,
  REMOTE_TABLES,
  toIso,
} from '@/data/remote/supabaseRemote';
import type { RemoteRecord } from '@/data/remote/types';
import { SYNC_COLLECTIONS } from '@/data/sync/types';

const USER_ID = 'user-123';
const AT_MS = Date.UTC(2026, 9, 6, 12, 0, 0);
const AT_ISO = '2026-10-06T12:00:00.000Z';

interface UpsertCall {
  table: string;
  rows: Record<string, unknown>[];
  options: unknown;
}

interface SelectCall {
  table: string;
  gtValue: string;
  range: [number, number];
}

interface FakeOptions {
  session?: { user: { id: string } } | null;
  pages?: (table: string, from: number, to: number) => unknown[];
  upsertError?: { message?: string; code?: string } | null;
  selectError?: { message?: string; code?: string } | null;
  rejectUpsert?: boolean;
}

function fakeClient(options: FakeOptions = {}) {
  const upserts: UpsertCall[] = [];
  const selects: SelectCall[] = [];

  const client = {
    auth: {
      getSession: async () => ({ data: { session: options.session ?? null } }),
    },
    from(table: string) {
      const builder = {
        upsert(rows: Record<string, unknown>[], opts: unknown) {
          upserts.push({ table, rows, options: opts });
          if (options.rejectUpsert) {
            return Promise.reject(new TypeError('TypeError: Failed to fetch'));
          }
          return Promise.resolve({ error: options.upsertError ?? null });
        },
        select(_columns: string) {
          let gtValue = '';
          const filter = {
            gt(_column: string, value: string) {
              gtValue = value;
              return filter;
            },
            order() {
              return filter;
            },
            range(from: number, to: number) {
              selects.push({ table, gtValue, range: [from, to] });
              const all = options.pages ? options.pages(table, from, to) : [];
              return Promise.resolve({ data: all, error: options.selectError ?? null });
            },
          };
          return filter;
        },
      };
      return builder;
    },
  };

  return { client: client as unknown as SupabaseClient, upserts, selects };
}

function record(id: string, overrides: Partial<RemoteRecord> = {}): RemoteRecord {
  return { id, updatedAt: AT_MS, deletedAt: null, data: { id }, ...overrides };
}

describe('mapeamento de coleções', () => {
  it('cobre exatamente as coleções de sync', () => {
    expect(Object.keys(REMOTE_TABLES).sort()).toEqual([...SYNC_COLLECTIONS].sort());
    expect(REMOTE_TABLES.medicationEvents).toBe('medication_events');
    expect(REMOTE_TABLES.warningSigns).toBe('warning_signs');
  });
});

describe('putMany', () => {
  it('sem sessão local falha como unauthenticated sem tocar no banco', async () => {
    const { client, upserts } = fakeClient({ session: null });
    const remote = createSupabaseRemote(client);

    await expect(remote.putMany('entries', [record('e1')])).rejects.toMatchObject({
      kind: 'unauthenticated',
    });
    expect(upserts).toHaveLength(0);
  });

  it('envia payload com user_id, ISO e upsert idempotente', async () => {
    const { client, upserts } = fakeClient({ session: { user: { id: USER_ID } } });
    const remote = createSupabaseRemote(client);

    await remote.putMany('medicationEvents', [record('ev1')]);
    await remote.putMany('entries', [record('t1', { data: null, deletedAt: AT_MS })]);

    expect(upserts[0]?.table).toBe('medication_events');
    expect(upserts[0]?.rows[0]).toEqual({
      user_id: USER_ID,
      id: 'ev1',
      data: { id: 'ev1' },
      updated_at: AT_ISO,
      deleted_at: null,
    });
    expect(upserts[0]?.options).toEqual({ onConflict: 'user_id,id' });
    expect(upserts[1]?.table).toBe('entries');
    expect(upserts[1]?.rows[0]).toMatchObject({
      data: null,
      updated_at: AT_ISO,
      deleted_at: AT_ISO,
    });
  });

  it('lista vazia não consulta sessão nem escreve', async () => {
    const { client, upserts } = fakeClient({ session: { user: { id: USER_ID } } });
    const remote = createSupabaseRemote(client);

    await remote.putMany('entries', []);

    expect(upserts).toHaveLength(0);
  });

  it('divide o envio em lotes de 500', async () => {
    const { client, upserts } = fakeClient({ session: { user: { id: USER_ID } } });
    const remote = createSupabaseRemote(client);
    const rows = Array.from({ length: 1200 }, (_, index) => record(`r${index}`));

    await remote.putMany('entries', rows);

    expect(upserts.map((call) => call.rows.length)).toEqual([500, 500, 200]);
    expect(upserts[2]?.rows.at(-1)?.id).toBe('r1199');
  });

  it('erro do servidor é classificado (JWT → unauthenticated)', async () => {
    const { client } = fakeClient({
      session: { user: { id: USER_ID } },
      upsertError: { message: 'JWT expired', code: 'PGRST301' },
    });
    const remote = createSupabaseRemote(client);

    await expect(remote.putMany('entries', [record('e1')])).rejects.toMatchObject({
      kind: 'unauthenticated',
    });
  });

  it('falha de rede é classificada como network', async () => {
    const { client } = fakeClient({
      session: { user: { id: USER_ID } },
      rejectUpsert: true,
    });
    const remote = createSupabaseRemote(client);

    await expect(remote.putMany('entries', [record('e1')])).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('erro inesperado vira unknown', async () => {
    const { client } = fakeClient({
      session: { user: { id: USER_ID } },
      upsertError: { message: 'algo inesperado' },
    });
    const remote = createSupabaseRemote(client);

    await expect(remote.putMany('entries', [record('e1')])).rejects.toMatchObject({
      kind: 'unknown',
    });
  });
});

describe('pullSince', () => {
  it('pagina com cursor gt + range e converte timestamps', async () => {
    const page1 = Array.from({ length: 1000 }, (_, index) => ({
      id: `p${index}`,
      data: { id: `p${index}` },
      updated_at: AT_ISO,
      deleted_at: null,
    }));
    const page2 = [
      { id: 't1', data: null, updated_at: AT_ISO, deleted_at: AT_ISO },
      { id: 'sem-data', data: { id: 'sem-data' }, updated_at: 'nao-e-data', deleted_at: null },
      { id: '', data: null, updated_at: AT_ISO, deleted_at: null },
    ];
    const all = [...page1, ...page2];
    const { client, selects } = fakeClient({
      pages: (_table, from, to) => all.slice(from, to + 1),
    });
    const remote = createSupabaseRemote(client);

    const rows = await remote.pullSince('warningSigns', AT_MS - 5000);

    expect(selects.map((call) => [call.table, call.range])).toEqual([
      ['warning_signs', [0, 999]],
      ['warning_signs', [1000, 1999]],
    ]);
    expect(selects[0]?.gtValue).toBe('2026-10-06T11:59:55.000Z');
    expect(rows).toHaveLength(1001); // 1000 vivos + 1 tombstone; 2 linhas inválidas fora
    expect(rows[0]).toMatchObject({ id: 'p0', updatedAt: AT_MS, deletedAt: null });
    expect(rows[1000]).toMatchObject({ id: 't1', updatedAt: AT_MS, deletedAt: AT_MS });
  });

  it('erro do servidor é propagado classificado', async () => {
    const { client } = fakeClient({
      selectError: { message: 'permission denied', code: '42501' },
    });
    const remote = createSupabaseRemote(client);

    await expect(remote.pullSince('entries', 0)).rejects.toMatchObject({
      kind: 'unauthenticated',
    });
  });

  it('sem linhas retorna vazio em uma única consulta', async () => {
    const { client, selects } = fakeClient();
    const remote = createSupabaseRemote(client);

    expect(await remote.pullSince('assessments', AT_MS)).toEqual([]);
    expect(selects).toHaveLength(1);
  });
});

describe('helpers', () => {
  it('toIso normaliza epoch ms', () => {
    expect(toIso(AT_MS)).toBe(AT_ISO);
  });

  it('fromServerRow descarta linhas malformadas', () => {
    expect(fromServerRow(null)).toBeNull();
    expect(fromServerRow('texto')).toBeNull();
    expect(fromServerRow({ data: {}, updated_at: AT_ISO })).toBeNull();
    expect(fromServerRow({ id: 'x', updated_at: 'nao-e-data' })).toBeNull();
    expect(fromServerRow({ id: 'x', updated_at: AT_ISO, updated_at_garbage: true })).toMatchObject({
      id: 'x',
      updatedAt: AT_MS,
      deletedAt: null,
    });
  });
});
