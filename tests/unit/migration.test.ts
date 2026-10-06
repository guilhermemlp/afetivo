import { describe, expect, it } from 'vitest';
import { moodLabel } from '@/core/mood';
import { migrateEntry, migrateProfile, migrateV1Payload } from '@/data/migration/v1';

/** Registro v1 completo (schemaVersion 3, escala valence). */
const V1_FULL_ENTRY = {
  id: 'entry-1',
  date: '2026-09-10',
  time: '21:15',
  schemaVersion: 3,
  moodScale: 'valence',
  recordKind: 'moment',
  moodScore: 2,
  activationLevel: 4,
  isMixedState: false,
  contexts: ['Começar uma tarefa'],
  observedSections: ['impulses', 'focus'],
  nextStep: 'Tomar banho',
  strategyEffect: 'helped',
  anxietyScore: 7,
  stressScore: 6,
  sadnessScore: 1,
  urgeScore: 8,
  isolationScore: 2,
  energyLevel: 4,
  anxietyLevel: 3,
  irritabilityLevel: 4,
  mentalClarityLevel: 4,
  compulsionLevel: 'mild',
  hyperfocusPresent: true,
  hyperfocusNotes: 'Duas horas no código',
  unmetIntentionNotes: 'Não lavei a louça',
  domainFlags: ['trabalho'],
  domainOther: 'Saúde',
  sleepHours: 6.5,
  sleepQuality: 'fair',
  sleepLatencyMinutes: 20,
  urgeDescription: 'Comprar algo agora',
  behaviorDescription: 'Abri o app de compra',
  behaviorFunctions: ['Alívio'],
  behaviorFunctionNote: 'Reduzia a tensão',
  consequence: 'Gasto evitado',
  impulsiveSpending: 0,
  timeToBaseline: '30 min',
  emotions: ['Inquieto'],
  somaticSymptoms: ['Tensão no ombro'],
  triggers: ['Notificação'],
  activities: ['Trabalho'],
  protectiveFactors: ['Passeio com o cachorro'],
  customTags: ['Dia produtivo'],
  physicalActivities: [
    { type: 'Corrida', durationMinutes: 30, intensity: 'moderate', postWorkoutFeeling: 'Disposto' },
  ],
  impulsiveBehaviors: [
    {
      id: 'imp-1',
      type: 'Compra por impulso',
      intensity: 3,
      outcome: 'paused',
      resisted: 'delayed',
      copingUsed: 'Esperei 10 minutos',
    },
  ],
  medicationIntakes: [
    {
      medicationId: 'med-1',
      medicationName: 'Lítio',
      status: 'taken',
      timeTaken: '08:00',
      sideEffects: ['Sede'],
    },
  ],
  journalNotes: 'Dia movimentado.',
  gratitudeNotes: 'Café da manhã bom',
  whatHelpedNotes: 'Respiração funda',
  createdAt: 1_760_000_000_000,
  isDemo: false,
};

/** Registro antigo (pré-v3): sem moodScale, escalas 0–5. */
const V1_LEGACY_ENTRY = {
  id: 'legacy-1',
  date: '2025-01-05',
  time: '20:00',
  moodScore: -1,
  energyLevel: 2,
  anxietyLevel: 3,
  irritabilityLevel: 1,
  journalNotes: 'Dia difícil.',
};

describe('migrateEntry', () => {
  it('converte o registro completo sem perder campos', () => {
    const { entry } = migrateEntry(V1_FULL_ENTRY);

    expect(entry.id).toBe('entry-1');
    expect(entry.schemaVersion).toBe(4);
    expect(entry.date).toBe('2026-09-10');
    expect(entry.time).toBe('21:15');
    expect(entry.moodScale).toBe('valence');
    expect(entry.moodScore).toBe(2);
    expect(entry.activationLevel).toBe(4);
    expect(entry.compulsion).toBe('mild');
    expect(entry.openedSections).toEqual(['impulses', 'focus']);
    expect(entry.recordKind).toBe('moment');

    expect(entry.metrics.sleepHours).toBe(6.5);
    expect(entry.metrics.sleepQuality).toBe('fair');
    expect(entry.metrics.energy).toBe(4);
    expect(entry.metrics.mentalClarity).toBe(4);
    expect(entry.metrics.stress).toBe(6);
    expect(entry.metrics.urge).toBe(8);
    expect(entry.metrics.impulsiveSpending).toBe(0);
    expect(entry.metrics.timeToBaseline).toBe('30 min');

    expect(entry.chain.urgeDescription).toBe('Comprar algo agora');
    expect(entry.chain.behaviorFunctions).toEqual(['Alívio']);
    expect(entry.chain.strategyEffect).toBe('helped');
    expect(entry.chain.whatHelpedNotes).toBe('Respiração funda');

    expect(entry.focus.hyperfocusPresent).toBe(true);
    expect(entry.focus.unmetIntentionNotes).toBe('Não lavei a louça');

    expect(entry.impulses).toHaveLength(1);
    expect(entry.impulses[0]?.id).toBe('imp-1');
    expect(entry.impulses[0]?.outcome).toBe('paused');
    expect(entry.impulses[0]?.copingUsed).toBe('Esperei 10 minutos');

    expect(entry.physicalActivities[0]).toEqual({
      type: 'Corrida',
      durationMinutes: 30,
      intensity: 'moderate',
      postFeeling: 'Disposto',
    });

    expect(entry.journalNotes).toBe('Dia movimentado.');
    expect(entry.gratitudeNotes).toBe('Café da manhã bom');
    expect(entry.createdAt).toBe(1_760_000_000_000);
    expect(entry.updatedAt).toBe(1_760_000_000_000);
    expect('medicationIntakes' in entry).toBe(false);
    expect('observedSections' in entry).toBe(false);
    expect('energyLevel' in entry.metrics).toBe(false);
  });

  it('prefere a escala 0–10 de ansiedade sobre o dobro da antiga 0–5', () => {
    const { entry } = migrateEntry(V1_FULL_ENTRY);
    expect(entry.metrics.anxiety).toBe(7); // anxietyScore vence anxietyLevel (3 → 6)
  });

  it('dobra as escalas antigas 0–5 para a canônica 0–10', () => {
    const { entry } = migrateEntry(V1_LEGACY_ENTRY);
    expect(entry.metrics.anxiety).toBe(6); // 3 × 2
    expect(entry.metrics.irritability).toBe(2); // 1 × 2
    expect(entry.metrics.energy).toBe(2); // 1–5 permanece 1–5
    expect(entry.moodScale).toBe('legacy');
    expect(entry.moodScore).toBe(-1);
    expect(moodLabel(entry)).toBe('Levemente Desanimado');
    // createdAt ausente → meio-dia da data do registro (fuso local)
    expect(entry.createdAt).toBe(new Date('2025-01-05T12:00:00').getTime());
  });

  it('transforma listas do v1 em tags tipadas', () => {
    const { entry } = migrateEntry(V1_FULL_ENTRY);
    const hasTag = (kind: string, label: string): boolean =>
      entry.tags.some((tag) => tag.kind === kind && tag.label === label);

    expect(hasTag('emotion', 'Inquieto')).toBe(true);
    expect(hasTag('somatic', 'Tensão no ombro')).toBe(true);
    expect(hasTag('trigger', 'Notificação')).toBe(true);
    expect(hasTag('activity', 'Trabalho')).toBe(true);
    expect(hasTag('domain', 'trabalho')).toBe(true);
    expect(hasTag('domain', 'Saúde')).toBe(true);
    expect(hasTag('protective', 'Passeio com o cachorro')).toBe(true);
    expect(hasTag('custom', 'Dia produtivo')).toBe(true);
    expect(hasTag('context', 'Começar uma tarefa')).toBe(true);
  });

  it('extrai tomadas de medicamento como eventos independentes', () => {
    const { intakeEvents } = migrateEntry(V1_FULL_ENTRY);

    expect(intakeEvents).toHaveLength(1);
    const [event] = intakeEvents;
    expect(event).toMatchObject({
      medicationId: 'med-1',
      medicationName: 'Lítio',
      kind: 'intake',
      date: '2026-09-10',
      time: '08:00',
      status: 'taken',
      sideEffects: ['Sede'],
    });
    expect(event?.id).toContain('entry-1');
    expect(event?.id).toContain('med-1');
  });

  it('descarta campos fora da faixa mantendo o registro', () => {
    const { entry } = migrateEntry({
      ...V1_LEGACY_ENTRY,
      moodScore: 99,
      sleepHours: -4,
    });
    expect(entry.moodScore).toBeNull();
    expect(entry.metrics.sleepHours).toBeNull();
    expect(entry.journalNotes).toBe('Dia difícil.');
  });

  it('lança erro só para problemas estruturais', () => {
    expect(() => migrateEntry({ date: '2026-01-01' })).toThrow(/identificador/i);
    expect(() => migrateEntry({ id: 'x', date: '2026-99-01' })).toThrow(/data/i);
    expect(() => migrateEntry('texto')).toThrow(/objeto/i);
    expect(() => migrateEntry(null)).toThrow(/objeto/i);
  });
});

describe('migrateProfile', () => {
  it('usa o nome informado e a preferência de lembretes', () => {
    const profile = migrateProfile({ name: 'Ana', notificationsEnabled: true });
    expect(profile.displayName).toBe('Ana');
    expect(profile.remindersOptIn).toBe(true);
    expect(profile.id).toBe('local');
  });

  it('não usa nome padrão hardcoded quando o perfil está vazio', () => {
    const profile = migrateProfile({ notificationsEnabled: false });
    expect(profile.displayName).toBeNull();
    expect(profile.remindersOptIn).toBe(false);
  });
});

describe('migrateV1Payload', () => {
  it('aceita um array puro de registros', () => {
    const outcome = migrateV1Payload([V1_FULL_ENTRY, V1_LEGACY_ENTRY]);
    expect(outcome.entries).toHaveLength(2);
    expect(outcome.medicationEvents).toHaveLength(1);
    expect(outcome.skipped).toHaveLength(0);
    expect(outcome.profile).toBeNull();
  });

  it('aceita o objeto de backup do v1 com tudo junto', () => {
    const outcome = migrateV1Payload({
      version: '3.0',
      entries: [V1_FULL_ENTRY],
      medications: [
        {
          id: 'med-1',
          name: 'Lítio',
          category: 'mood_stabilizer',
          dosage: '300 mg',
          frequency: 'twice_daily',
          active: true,
        },
      ],
      profile: { name: 'Ana', notificationsEnabled: true },
    });

    expect(outcome.entries).toHaveLength(1);
    expect(outcome.medications).toHaveLength(1);
    expect(outcome.medications[0]).toMatchObject({
      name: 'Lítio',
      dosage: '300 mg',
      frequency: 'twice_daily',
    });
    expect(outcome.profile?.displayName).toBe('Ana');
  });

  it('registros inválidos não derrubam os válidos (v1 era tudo-ou-nada)', () => {
    const outcome = migrateV1Payload([
      V1_FULL_ENTRY,
      { id: 'quebrado', date: 'data-invalida' },
      { date: '2026-01-01' },
      V1_FULL_ENTRY, // id repetido
    ]);

    expect(outcome.entries).toHaveLength(1);
    expect(outcome.skipped).toHaveLength(3);
    expect(outcome.skipped[0]?.reason).toMatch(/data/i);
    expect(outcome.skipped[1]?.reason).toMatch(/identificador/i);
    expect(outcome.skipped[2]?.reason).toMatch(/duplicado/i);
    expect(outcome.skipped[2]?.id).toBe('entry-1');
  });

  it('descarta medicamento sem nome sem afetar os demais', () => {
    const outcome = migrateV1Payload({
      entries: [],
      medications: [
        { id: 'ok', name: 'Vacina' },
        { id: 'sem-nome', name: '   ' },
      ],
    });

    expect(outcome.medications).toHaveLength(1);
    expect(outcome.skipped).toHaveLength(1);
    expect(outcome.skipped[0]?.kind).toBe('medication');
  });

  it('rejeita payload irreconhecível', () => {
    expect(() => migrateV1Payload(null)).toThrow(/não reconhecido/i);
    expect(() => migrateV1Payload('backup')).toThrow(/não reconhecido/i);
    expect(() => migrateV1Payload(42)).toThrow(/não reconhecido/i);
  });

  it('objeto vazio migra nada sem erro', () => {
    const outcome = migrateV1Payload({});
    expect(outcome.entries).toHaveLength(0);
    expect(outcome.skipped).toHaveLength(0);
  });
});
