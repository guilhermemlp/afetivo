import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { setAppStore } from '@/data/appStore';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { renderApp, setupStore } from '../helpers/render';

afterEach(() => setAppStore(null));

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

  it('mostra o modo local quando não há env', async () => {
    setupStore();
    renderApp(<SettingsPage />);

    expect(await screen.findByText(/Modo local/)).toBeInTheDocument();
    expect(screen.getByText(/Não substitui avaliação profissional/)).toBeInTheDocument();
  });
});
