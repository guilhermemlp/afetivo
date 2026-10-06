import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { localDate } from '@/core/dates';
import { createMedicationEvent, medicationSchema } from '@/core/medication';
import { setAppStore } from '@/data/appStore';
import { MedicationsPage } from '@/features/medications/MedicationsPage';
import { renderApp, setupStore } from '../helpers/render';

afterEach(() => setAppStore(null));

describe('MedicationsPage', () => {
  it('cadastra medicação e registra tomada em um clique', async () => {
    const store = setupStore();
    const user = userEvent.setup();
    renderApp(<MedicationsPage />);

    expect(await screen.findByText('Nenhuma medicação cadastrada')).toBeInTheDocument();

    const addButtons = screen.getAllByRole('button', { name: 'Adicionar medicação' });
    await user.click(addButtons[0] as HTMLElement);
    const dialog = await screen.findByRole('dialog', { name: 'Nova medicação' });
    await user.type(within(dialog).getByLabelText('Nome'), 'Lítio');
    await user.selectOptions(within(dialog).getByLabelText('Categoria'), 'mood_stabilizer');
    await user.type(within(dialog).getByLabelText('Dosagem'), '300 mg');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    expect(screen.getByText('Lítio')).toBeInTheDocument();
    const medications = await store.medications.list();
    expect(medications).toHaveLength(1);
    expect(medications[0]).toMatchObject({
      name: 'Lítio',
      category: 'mood_stabilizer',
      dosage: '300 mg',
    });

    await user.click(screen.getByRole('button', { name: 'Tomada' }));
    await waitFor(async () => expect(await store.medicationEvents.list()).toHaveLength(1));

    const [event] = await store.medicationEvents.list();
    expect(event).toMatchObject({
      kind: 'intake',
      status: 'taken',
      medicationName: 'Lítio',
      dose: '300 mg',
      date: localDate(new Date()),
    });

    const todayList = screen.getByRole('list', { name: 'Tomadas de hoje' });
    expect(todayList).toHaveTextContent('Lítio');
  });

  it('edita medicação e exclui em dois passos preservando o histórico', async () => {
    const medication = medicationSchema.parse({
      id: 'med-1',
      name: 'Sertralina',
      category: 'antidepressant',
      dosage: '50 mg',
      createdAt: 1,
      updatedAt: 1,
    });
    const event = createMedicationEvent(
      {
        medicationId: 'med-1',
        medicationName: 'Sertralina',
        kind: 'intake',
        date: '2026-10-06',
        time: '08:00',
        dose: '50 mg',
        status: 'taken',
      },
      1,
    );
    const store = setupStore({ medications: [medication], medicationEvents: [event] });
    const user = userEvent.setup();
    renderApp(<MedicationsPage />);

    const catalog = within(await screen.findByRole('list', { name: 'Medicações cadastradas' }));
    expect(catalog.getByText('Sertralina')).toBeInTheDocument();

    await user.click(catalog.getByRole('button', { name: 'Editar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Editar medicação' });
    const nameInput = within(dialog).getByLabelText('Nome');
    await user.clear(nameInput);
    await user.type(nameInput, 'Sertralina 50');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect((await store.medications.list())[0]?.name).toBe('Sertralina 50');

    await user.click(catalog.getByRole('button', { name: 'Excluir' }));
    expect(catalog.getByRole('button', { name: 'Confirmar exclusão' })).toBeInTheDocument();
    expect(await store.medications.list()).toHaveLength(1);

    await user.click(catalog.getByRole('button', { name: 'Confirmar exclusão' }));
    await waitFor(async () => expect(await store.medications.list()).toHaveLength(0));
    expect(await store.medicationEvents.list()).toHaveLength(1);
  });

  it('registra evento de ajuste de dose pelo formulário', async () => {
    const medication = medicationSchema.parse({
      id: 'med-1',
      name: 'Lítio',
      createdAt: 1,
      updatedAt: 1,
    });
    const store = setupStore({ medications: [medication] });
    const user = userEvent.setup();
    renderApp(<MedicationsPage />);

    const catalog = await screen.findByRole('list', { name: 'Medicações cadastradas' });
    await user.click(within(catalog).getByRole('button', { name: 'Evento' }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo evento — Lítio' });

    await user.selectOptions(within(dialog).getByLabelText('Tipo'), 'adjustment');
    await user.type(within(dialog).getByLabelText('Dose'), '450 mg');
    await user.type(
      within(dialog).getByLabelText('Observações'),
      'subi a dose conforme orientação',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    const events = await store.medicationEvents.list();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: 'adjustment',
      dose: '450 mg',
      notes: 'subi a dose conforme orientação',
      medicationName: 'Lítio',
      status: null,
    });
  });
});
