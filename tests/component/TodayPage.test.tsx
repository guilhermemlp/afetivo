import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { setAppStore } from '@/data/appStore';
import { TodayPage } from '@/features/today/TodayPage';
import { renderApp, setupStore } from '../helpers/render';

afterEach(() => setAppStore(null));

describe('TodayPage', () => {
  it('salva um registro rápido e lista o dia', async () => {
    const store = setupStore();
    const user = userEvent.setup();
    renderApp(<TodayPage />);

    expect(await screen.findByText('Nenhum registro hoje')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agradável' }));
    await user.click(screen.getByRole('button', { name: 'Ativação 3' }));
    await user.selectOptions(screen.getByLabelText('Ansiedade'), '7');
    await user.click(screen.getByRole('button', { name: 'Salvar registro' }));

    expect(await screen.findByRole('status')).toHaveTextContent(/Registro salvo às \d{2}:\d{2}/);

    const entries = await store.entries.list();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      moodScale: 'valence',
      moodScore: 2,
      activationLevel: 3,
      recordKind: 'moment',
    });
    expect(entries[0]?.metrics.anxiety).toBe(7);
    expect(entries[0]?.metrics.urge).toBeNull(); // ausente continua ausente

    expect(screen.getByText('Ativação 3/5')).toBeInTheDocument();
  });

  it('permite salvar respostas puladas e vários momentos no mesmo dia', async () => {
    const store = setupStore();
    const user = userEvent.setup();
    renderApp(<TodayPage />);
    await screen.findByText('Nenhum registro hoje');

    await user.click(screen.getByRole('button', { name: 'Salvar registro' }));
    await waitFor(async () => expect(await store.entries.list()).toHaveLength(1));
    await user.click(screen.getByRole('button', { name: 'Salvar registro' }));
    await waitFor(async () => expect(await store.entries.list()).toHaveLength(2));

    const entries = await store.entries.list();
    expect(entries.every((entry) => entry.moodScore === null)).toBe(true);
    expect(entries.every((entry) => entry.activationLevel === null)).toBe(true);
    expect(entries[0]?.date).toBe(entries[1]?.date);
  });

  it('abre o registro detalhado e salva mesmo sem registro rápido', async () => {
    const store = setupStore();
    const user = userEvent.setup();
    renderApp(<TodayPage />);
    await screen.findByText('Nenhum registro hoje');

    await user.click(screen.getByRole('button', { name: 'Mais detalhes' }));
    const dialog = await screen.findByRole('dialog', { name: 'Detalhes do registro' });

    await user.click(within(dialog).getByRole('button', { name: 'Salvar detalhes' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    const entries = await store.entries.list();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.moodScore).toBeNull();
    expect(entries[0]?.recordKind).toBe('moment');
  });
});
