import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { formatDateBR, localDate } from '@/core/dates';
import { createBlankEntry, impulseSchema, withUpdates, type Entry } from '@/core/entry';
import { createMedicationEvent, type MedicationEvent } from '@/core/medication';
import { setAppStore } from '@/data/appStore';
import { PatternsPage } from '@/features/patterns/PatternsPage';
import { renderApp, setupStore } from '../helpers/render';

afterEach(() => setAppStore(null));

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function seedEntries(): Entry[] {
  const today = withUpdates(createBlankEntry(daysAgo(0)), {
    moodScale: 'valence',
    moodScore: 2,
    activationLevel: 4,
    metrics: { ...createBlankEntry(daysAgo(0)).metrics, sleepHours: 8 },
    tags: [{ kind: 'trigger' as const, label: 'sono ruim' }],
  });
  const yesterday = withUpdates(createBlankEntry(daysAgo(1)), {
    moodScale: 'valence',
    moodScore: -2,
    activationLevel: 2,
    impulses: [impulseSchema.parse({ id: 'i1', type: 'insôno' })],
  });
  const old = withUpdates(createBlankEntry(daysAgo(30)), {
    moodScale: 'valence',
    moodScore: 3,
    activationLevel: 3,
    tags: [{ kind: 'custom' as const, label: 'trabalho' }],
  });
  return [old, yesterday, today];
}

function seedIntake(): MedicationEvent[] {
  return [createMedicationEvent({ medicationId: 'm1', medicationName: 'Lítio', kind: 'intake' })];
}

function statValue(resumo: HTMLElement, label: string): string | null | undefined {
  return within(resumo).getByText(label).nextElementSibling?.textContent;
}

const MONTHS_BR = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

describe('PatternsPage', () => {
  it('mostra resumo, gráficos e tags do período padrão (7 dias)', async () => {
    setupStore({ entries: seedEntries(), medicationEvents: seedIntake() });
    renderApp(<PatternsPage />);

    expect(await screen.findByRole('heading', { name: 'Padrões', level: 1 })).toBeInTheDocument();
    const resumo = await screen.findByLabelText('Resumo do período');
    expect(screen.getByRole('heading', { name: 'Humor ao longo do período' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Ativação ao longo do período' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Afetivograma' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '7 dias' })).toHaveAttribute('aria-pressed', 'true');

    expect(statValue(resumo, 'Registros')).toBe('2');
    expect(statValue(resumo, 'Dias com registro')).toBe('2/7');
    expect(statValue(resumo, 'Humor médio')).toBe('0');
    expect(statValue(resumo, 'Sono médio')).toBe('8 h');
    expect(statValue(resumo, 'Tomadas')).toBe('1');
    expect(statValue(resumo, 'Impulsos')).toBe('1');

    expect(screen.getAllByText(/^Ver valores \(2 dias com resposta\)$/)).toHaveLength(2);
    expect(screen.getByText('sono ruim')).toBeInTheDocument();
    expect(screen.queryByText('trabalho')).toBeNull();
    expect(screen.getByText(/Correlação não implica causa/)).toBeInTheDocument();
  });

  it('recalcula o resumo e as tags ao trocar para todo o histórico', async () => {
    const user = userEvent.setup();
    setupStore({ entries: seedEntries(), medicationEvents: seedIntake() });
    renderApp(<PatternsPage />);
    const resumo = await screen.findByLabelText('Resumo do período');
    expect(statValue(resumo, 'Registros')).toBe('2');
    expect(screen.queryByText('trabalho')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Todo o histórico' }));

    expect(statValue(resumo, 'Registros')).toBe('3');
    expect(statValue(resumo, 'Dias com registro')).toBe('3/31');
    expect(statValue(resumo, 'Humor médio')).toBe('1');
    expect(screen.getByText('trabalho')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Todo o histórico' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('navega meses no afetivograma e rotula o dia de hoje', async () => {
    const user = userEvent.setup();
    setupStore({ entries: seedEntries() });
    renderApp(<PatternsPage />);

    const now = new Date();
    const currentLabel = `${MONTHS_BR[now.getMonth()]} de ${now.getFullYear()}`;
    expect(await screen.findByText(currentLabel)).toBeInTheDocument();

    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousLabel = `${MONTHS_BR[previous.getMonth()]} de ${previous.getFullYear()}`;

    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Mês anterior' }));

    expect(screen.getByText(previousLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Próximo mês' }));
    const today = formatDateBR(localDate(new Date()));
    expect(await screen.findByLabelText(`${today}: humor médio 2, 1 registro`)).toBeInTheDocument();
  });

  it('mostra estado vazio quando ainda não há registros', async () => {
    setupStore();
    renderApp(<PatternsPage />);

    expect(await screen.findByText('Sem dados para analisar')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrar um momento' })).toHaveAttribute('href', '/');
  });

  it('mostra sono, impulsos e correlações do período', async () => {
    setupStore({ entries: seedEntries(), medicationEvents: seedIntake() });
    renderApp(<PatternsPage />);
    await screen.findByLabelText('Resumo do período');

    expect(screen.getByRole('heading', { name: 'Sono ao longo do período' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Impulsos ao longo do período' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ver valores \(1 dias com resposta\)/)).toBeInTheDocument();
    expect(screen.getByText(/Ver valores \(2 dias com registro\)/)).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Correlações do período' })).toBeInTheDocument();
    expect(screen.getByText('Humor × ativação')).toBeInTheDocument();
    expect(screen.getByText('Humor × sono')).toBeInTheDocument();
    expect(screen.getByText('Humor × impulsos')).toBeInTheDocument();
    expect(screen.getAllByText(/r = — · n = \d+ dias/)).toHaveLength(3);
    expect(screen.getAllByText(/Dados insuficientes/)).toHaveLength(3);
  });

  it('gera a análise local e avisa que a IA não está configurada', async () => {
    const user = userEvent.setup();
    setupStore({ entries: seedEntries() });
    renderApp(<PatternsPage />);
    await screen.findByLabelText('Resumo do período');

    await user.click(screen.getByRole('button', { name: 'Gerar análise' }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/Provedor: Análise local/);
    expect(status).toHaveTextContent(/IA não configurada no servidor/);
    expect(status).toHaveTextContent(/não é diagnóstico nem recomendação de medicação/);

    await user.click(screen.getByRole('button', { name: '14 dias' }));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
