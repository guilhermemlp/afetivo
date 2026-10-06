import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBlankEntry } from '@/core/entry';
import { setAppStore } from '@/data/appStore';
import { EntryDetailsModal } from '@/features/entryDetails/EntryDetailsModal';
import { renderApp, setupStore } from '../helpers/render';

afterEach(() => setAppStore(null));

describe('EntryDetailsModal', () => {
  it('preenche sono, tags e impulso e persiste no registro', async () => {
    const entry = createBlankEntry(new Date(2026, 9, 6, 10, 0));
    const store = setupStore({ entries: [entry] });
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderApp(<EntryDetailsModal entry={entry} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /Sono & energia/ }));
    await user.type(screen.getByLabelText('Horas de sono'), '7.5');
    await user.selectOptions(screen.getByLabelText('Qualidade do sono'), 'good');

    await user.click(screen.getByRole('button', { name: /Estado, contexto & tags/ }));
    await user.type(screen.getByLabelText('Nova tag'), 'dia leve');
    await user.click(screen.getByRole('button', { name: 'Adicionar tag' }));

    await user.click(screen.getByRole('button', { name: /Impulsos, compulsões & cadeia/ }));
    await user.click(screen.getByRole('button', { name: 'Adicionar impulso' }));
    await user.type(screen.getByLabelText('Tipo de impulso'), 'Compras por impulso');
    await user.selectOptions(screen.getByLabelText('Intensidade (1–5)'), '4');

    await user.click(screen.getByRole('button', { name: 'Salvar detalhes' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    const saved = (await store.entries.list())[0];
    expect(saved?.metrics.sleepHours).toBe(7.5);
    expect(saved?.metrics.sleepQuality).toBe('good');
    expect(saved?.tags).toHaveLength(1);
    expect(saved?.tags[0]?.label).toBe('dia leve');
    expect(saved?.impulses).toHaveLength(1);
    expect(saved?.impulses[0]).toMatchObject({ type: 'Compras por impulso', intensity: 4 });
    expect(saved?.openedSections).toEqual(expect.arrayContaining(['sleep', 'context', 'impulses']));
  });

  it('salvar sem preencher mantém tudo em branco (nunca zero)', async () => {
    const entry = createBlankEntry(new Date(2026, 9, 6, 10, 0));
    const store = setupStore({ entries: [entry] });
    const user = userEvent.setup();
    renderApp(<EntryDetailsModal entry={entry} onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Salvar detalhes' }));
    await waitFor(async () => expect(await store.entries.list()).toHaveLength(1));

    const saved = (await store.entries.list())[0];
    expect(saved).toBeDefined();
    expect(Object.values(saved?.metrics ?? {}).every((value) => value === null)).toBe(true);
    expect(saved?.openedSections).toEqual([]);
    expect(saved?.impulses).toEqual([]);
    expect(saved?.tags).toEqual([]);
  });

  it('remove tag e impulso adicionados', async () => {
    const entry = createBlankEntry(new Date(2026, 9, 6, 10, 0));
    const store = setupStore({ entries: [entry] });
    const user = userEvent.setup();
    renderApp(<EntryDetailsModal entry={entry} onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: /Estado, contexto & tags/ }));
    await user.type(screen.getByLabelText('Nova tag'), 'temporária');
    await user.click(screen.getByRole('button', { name: 'Adicionar tag' }));
    await user.click(screen.getByRole('button', { name: 'Remover tag temporária' }));

    await user.click(screen.getByRole('button', { name: /Impulsos, compulsões & cadeia/ }));
    await user.click(screen.getByRole('button', { name: 'Adicionar impulso' }));
    await user.click(screen.getByRole('button', { name: 'Remover impulso 1' }));

    await user.click(screen.getByRole('button', { name: 'Salvar detalhes' }));
    await waitFor(async () => expect(await store.entries.list()).toHaveLength(1));

    const saved = (await store.entries.list())[0];
    expect(saved?.tags).toEqual([]);
    expect(saved?.impulses).toEqual([]);
  });
});
