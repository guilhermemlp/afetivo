import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { appEnv, resetAppEnv } from '@/core/env';
import { AuthError } from '@/data/auth';
import { setAppStore } from '@/data/appStore';
import { resetSessionStore } from '@/data/hooks/session';
import { invalidateAfterSync } from '@/data/sync/bridge';
import { resetSyncStatus, setSyncStatus } from '@/data/sync/status';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { renderApp, setupStore } from '../helpers/render';

const mocks = vi.hoisted(() => ({
  sendMagicLink: vi.fn<(email: string) => Promise<void>>(),
  signOut: vi.fn<() => Promise<void>>(),
  currentSession: vi.fn<() => Promise<Session | null>>(),
  onAuthChange: vi.fn<() => { data: { subscription: { unsubscribe: () => void } } }>(),
}));

vi.mock('@/data/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/auth')>();
  return {
    ...actual,
    getAuthApi: () => ({
      sendMagicLink: mocks.sendMagicLink,
      signOut: mocks.signOut,
      currentSession: mocks.currentSession,
      onAuthChange: mocks.onAuthChange,
    }),
  };
});

function enableRemoteEnv(): void {
  resetAppEnv();
  appEnv({
    VITE_SUPABASE_URL: 'https://demo.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'anon-demo',
  });
}

beforeEach(() => {
  resetAppEnv();
  resetSessionStore();
  resetSyncStatus();
  mocks.sendMagicLink.mockImplementation(async () => {});
  mocks.signOut.mockImplementation(async () => {});
  mocks.currentSession.mockImplementation(async () => null);
  mocks.onAuthChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: () => {} } },
  }));
});

afterEach(() => {
  setAppStore(null);
  resetAppEnv();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('SettingsPage', () => {
  it('salva o nome de exibição no perfil', async () => {
    const store = setupStore();
    const user = userEvent.setup();
    renderApp(<SettingsPage />);

    const name = await screen.findByLabelText('Nome de exibição');
    await user.type(name, 'Ana');
    await user.click(screen.getByRole('button', { name: 'Salvar nome' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Nome salvo.');
    expect((await store.profile.get())?.displayName).toBe('Ana');
  });

  it('preenche o nome sozinho quando a sync traz o perfil de outro dispositivo', async () => {
    const store = setupStore();
    const { queryClient } = renderApp(<SettingsPage />);

    const name = await screen.findByLabelText('Nome de exibição');
    expect(name).toHaveValue('');

    // O pull do servidor gravou no store; a sync notifica o React Query.
    await store.profile.put({ ...(await store.profile.get()), displayName: 'Guilherme' });
    invalidateAfterSync(queryClient, {
      pushed: 1,
      tombstonesPushed: 0,
      merged: 1,
      deleted: 0,
      skipped: 0,
    });

    await waitFor(() => expect(screen.getByLabelText('Nome de exibição')).toHaveValue('Guilherme'));
  });

  it('mostra o modo local quando não há env, sem formulário de login', async () => {
    setupStore();
    renderApp(<SettingsPage />);

    expect(await screen.findByText(/Modo local/)).toBeInTheDocument();
    expect(screen.getByText(/Não substitui avaliação profissional/)).toBeInTheDocument();
    expect(screen.queryByLabelText('E-mail')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Enviar link de acesso' })).toBeNull();
  });

  it('envia o magic link quando o remoto está configurado', async () => {
    enableRemoteEnv();
    setupStore();
    const user = userEvent.setup();
    renderApp(<SettingsPage />);

    const email = await screen.findByLabelText('E-mail');
    await user.type(email, 'pessoa@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar link de acesso' }));

    expect(await screen.findByText(/Link enviado para pessoa@example\.com/)).toBeVisible();
    expect(mocks.sendMagicLink).toHaveBeenCalledWith('pessoa@example.com');
  });

  it('mostra o erro do provedor ao falhar o envio', async () => {
    enableRemoteEnv();
    mocks.sendMagicLink.mockRejectedValueOnce(new AuthError('rate_limited', 'rate limit'));
    setupStore();
    const user = userEvent.setup();
    renderApp(<SettingsPage />);

    const email = await screen.findByLabelText('E-mail');
    await user.type(email, 'pessoa@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar link de acesso' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/aguarde alguns minutos/);
  });

  it('com sessão ativa mostra a conta, o status de sync e o sair', async () => {
    enableRemoteEnv();
    mocks.currentSession.mockResolvedValueOnce({
      user: { email: 'pessoa@example.com' },
    } as unknown as Session);
    setSyncStatus({ kind: 'ok', at: Date.now(), pushed: 2, merged: 1 });
    setupStore();
    const user = userEvent.setup();
    renderApp(<SettingsPage />);

    expect(await screen.findByText(/Conectado como/)).toBeInTheDocument();
    expect(screen.getByText('pessoa@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Última sincronização às \d{2}:\d{2}/)).toHaveTextContent(
      '2 enviado(s), 1 recebido(s)',
    );

    await user.click(screen.getByRole('button', { name: 'Sair da conta' }));
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalled());
  });

  it('exporta o backup completo como JSON', async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:backup');
    const revokeObjectURL = vi.fn<(url: string) => void>(() => {});
    let downloadedAs: string | null = null;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadedAs = this.download;
    });

    setupStore();
    const user = userEvent.setup();
    renderApp(<SettingsPage />);

    await user.click(await screen.findByRole('button', { name: 'Exportar dados (JSON)' }));

    expect(await screen.findByText(/Arquivo gerado/)).toBeInTheDocument();
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(downloadedAs).toMatch(/^afetivo-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:backup');
    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    expect((blob as Blob).type).toBe('application/json');
  });
});
