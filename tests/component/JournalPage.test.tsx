import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { createBlankEntry, withUpdates, type Entry } from '@/core/entry';
import { setAppStore } from '@/data/appStore';
import { JournalPage } from '@/features/journal/JournalPage';
import { renderApp, setupStore } from '../helpers/render';

afterEach(() => setAppStore(null));

function seedEntries(): Entry[] {
  const older = withUpdates(
    createBlankEntry(new Date(2026, 9, 5, 10, 30)),
    {
      moodScale: 'valence',
      moodScore: -2,
      activationLevel: 4,
      journalNotes: 'dia difícil, dormi mal',
      tags: [{ kind: 'trigger', label: 'pouco sono' }],
    },
    1,
  );
  const newer = withUpdates(
    createBlankEntry(new Date(2026, 9, 6, 8, 15)),
    {
      moodScale: 'valence',
      moodScore: 2,
      activationLevel: 2,
      journalNotes: 'caminhada no parque me ajudou',
    },
    2,
  );
  return [older, newer];
}

describe('JournalPage', () => {
  it('lista os registros em ordem decrescente com notas e tags', async () => {
    setupStore({ entries: seedEntries() });
    renderApp(<JournalPage />);

    expect(await screen.findByText('caminhada no parque me ajudou')).toBeInTheDocument();

    const dateCells = screen.getAllByText(/\d{2}\/\d{2}\/2026/);
    expect(dateCells[0]).toHaveTextContent('06/10/2026');
    expect(dateCells[1]).toHaveTextContent('05/10/2026');

    expect(screen.getByText('pouco sono')).toBeInTheDocument();
    expect(screen.getByText(/Ativação 4\/5/)).toBeInTheDocument();
  });

  it('filtra por busca e por humor, com estado vazio de resultado', async () => {
    const user = userEvent.setup();
    setupStore({ entries: seedEntries() });
    renderApp(<JournalPage />);
    await screen.findByText('caminhada no parque me ajudou');

    await user.type(screen.getByLabelText('Buscar'), 'dormi mal');
    expect(screen.getByText(/dia difícil/)).toBeInTheDocument();
    expect(screen.queryByText(/caminhada no parque/)).toBeNull();

    await user.clear(screen.getByLabelText('Buscar'));
    await user.type(screen.getByLabelText('Buscar'), 'nada parecido');
    expect(await screen.findByText('Nenhum resultado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar busca e filtros' }));
    expect(screen.getByText(/caminhada no parque/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Baixo' }));
    expect(screen.getByText(/dia difícil/)).toBeInTheDocument();
    expect(screen.queryByText(/caminhada no parque/)).toBeNull();
  });

  it('edita a nota pelo modal e persiste no store', async () => {
    const store = setupStore({ entries: seedEntries() });
    const user = userEvent.setup();
    renderApp(<JournalPage />);

    await user.click(
      await screen.findByRole('button', { name: 'Editar registro das 08:15 em 06/10/2026' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Editar registro' });

    const note = within(dialog).getByLabelText('Nota');
    await user.clear(note);
    await user.type(note, 'anotei uma vitrine');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const entries = await store.entries.list();
    expect(entries.find((entry) => entry.date === '2026-10-06')?.journalNotes).toBe(
      'anotei uma vitrine',
    );
  });

  it('exclui em dois passos, sem apagar no primeiro clique', async () => {
    const store = setupStore({ entries: seedEntries() });
    const user = userEvent.setup();
    renderApp(<JournalPage />);

    await user.click(
      await screen.findByRole('button', { name: 'Editar registro das 10:30 em 05/10/2026' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Editar registro' });

    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }));
    expect(within(dialog).getByRole('button', { name: 'Confirmar exclusão' })).toBeInTheDocument();
    expect(await store.entries.list()).toHaveLength(2);

    await user.click(within(dialog).getByRole('button', { name: 'Confirmar exclusão' }));
    await waitFor(async () => expect(await store.entries.list()).toHaveLength(1));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect((await store.entries.list())[0]?.date).toBe('2026-10-06');
  });

  it('mostra ação de criação quando ainda não há nenhum registro', async () => {
    setupStore();
    renderApp(<JournalPage />);

    expect(await screen.findByText('Nenhum registro ainda')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrar um momento' })).toHaveAttribute('href', '/');
  });

  it('abre o detalhe do registro pelo feed', async () => {
    setupStore({ entries: seedEntries() });
    const user = userEvent.setup();
    renderApp(<JournalPage />);

    await user.click(
      await screen.findByRole('button', { name: 'Detalhes do registro das 08:15 em 06/10/2026' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Detalhes do registro' });
    expect(within(dialog).getByText(/Tudo é opcional/)).toBeInTheDocument();
  });

  it('identifica o resumo do dia no feed', async () => {
    const summary = withUpdates(
      createBlankEntry(new Date(2026, 9, 6, 21, 0)),
      {
        recordKind: 'daily_summary',
        moodScale: 'valence',
        moodScore: 1,
        journalNotes: 'dia fechado com calma',
      },
      3,
    );
    setupStore({ entries: [...seedEntries(), summary] });
    renderApp(<JournalPage />);

    expect(await screen.findByText('dia fechado com calma')).toBeInTheDocument();
    expect(screen.getByText('Resumo do dia')).toBeInTheDocument();
  });
});
