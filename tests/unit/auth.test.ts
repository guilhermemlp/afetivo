import { describe, expect, it, vi } from 'vitest';
import { resetAppEnv } from '@/core/env';
import {
  AuthError,
  createAuthApi,
  getAuthApi,
  getSupabase,
  resetSupabase,
  type AuthClient,
} from '@/data/auth';

function makeClient(
  options: {
    signInError?: { message: string } | null;
    session?: unknown;
  } = {},
) {
  const signInWithOtp = vi.fn().mockResolvedValue({ error: options.signInError ?? null });
  const signOut = vi.fn().mockResolvedValue({ error: null });
  const getSession = vi.fn().mockResolvedValue({ data: { session: options.session ?? null } });
  const unsubscribe = vi.fn();
  let handler: ((event: string, session: unknown) => void) | null = null;
  const onAuthStateChange = vi.fn((callback: (event: string, session: unknown) => void) => {
    handler = callback;
    return { data: { subscription: { unsubscribe } } };
  });
  const client = {
    auth: { signInWithOtp, signOut, getSession, onAuthStateChange },
  } as unknown as AuthClient;
  const emit = (session: unknown) => handler?.('SIGNED_IN', session);
  return { client, signInWithOtp, signOut, getSession, unsubscribe, emit };
}

describe('createAuthApi', () => {
  it('envia o magic link com e-mail e redirect padrão', async () => {
    const { client, signInWithOtp } = makeClient();
    const api = createAuthApi(client);

    await api.sendMagicLink('ana@exemplo.com');

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'ana@exemplo.com',
      options: { emailRedirectTo: window.location.origin },
    });
  });

  it('aceita um redirect explícito (deep link do deploy)', async () => {
    const { client, signInWithOtp } = makeClient();
    const api = createAuthApi(client);

    await api.sendMagicLink('ana@exemplo.com', 'https://afetivo.onrender.com');

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'ana@exemplo.com',
      options: { emailRedirectTo: 'https://afetivo.onrender.com' },
    });
  });

  it.each([
    ['Email rate limit exceeded', 'rate_limited'],
    ['Invalid email address', 'invalid_email'],
    ['Failed to fetch', 'network'],
    ['algo inesperado', 'unknown'],
  ])('classifica o erro "%s" como %s', async (message, kind) => {
    const { client } = makeClient({ signInError: { message } });
    const api = createAuthApi(client);

    await expect(api.sendMagicLink('ana@exemplo.com')).rejects.toMatchObject({ kind });
  });

  it('propaga AuthError com kind e mensagem', async () => {
    const { client } = makeClient({ signInError: { message: 'algo inesperado' } });
    const api = createAuthApi(client);

    const error = await api.sendMagicLink('ana@exemplo.com').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AuthError);
    expect((error as AuthError).message).toBe('algo inesperado');
  });

  it('lê a sessão atual (ou null quando deslogado)', async () => {
    const session = { access_token: 'token' };
    const loggedOut = createAuthApi(makeClient().client);
    expect(await loggedOut.currentSession()).toBeNull();

    const logged = createAuthApi(makeClient({ session }).client);
    expect(await logged.currentSession()).toBe(session);
  });

  it('onAuthChange entrega sessões e devolve o cancelamento', () => {
    const { client, unsubscribe, emit } = makeClient();
    const api = createAuthApi(client);
    const received: unknown[] = [];

    const stop = api.onAuthChange((session) => received.push(session));
    emit({ access_token: 'token' });
    expect(received).toEqual([{ access_token: 'token' }]);

    stop();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('signOut sem erro resolve', async () => {
    const { client } = makeClient();
    await expect(createAuthApi(client).signOut()).resolves.toBeUndefined();
  });
});

describe('getSupabase', () => {
  it('sem env configurada o cliente é null (modo local puro)', () => {
    resetSupabase();
    resetAppEnv();

    expect(getSupabase()).toBeNull();
    expect(getAuthApi()).toBeNull();
  });
});
