import assert from 'node:assert/strict';
import { test } from 'node:test';
import { entriesInPeriod, localDate } from '../src/services/dates';
import { generateInitialSeedEntries } from '../src/services/storage';
import { buildDeterministicReport } from '../src/components/ClinicalReportModal';

test('periods filter by calendar days rather than number of records', () => {
  const entry = generateInitialSeedEntries()[0];
  const entries = ['2026-09-01', '2026-09-30', '2026-10-01', '2026-10-06', '2026-10-07']
    .map((date, index) => ({ ...entry, id: String(index), date }));
  assert.deepEqual(entriesInPeriod(entries, 7, new Date('2026-10-06T22:00:00')).map(e => e.date),
    ['2026-09-30', '2026-10-01', '2026-10-06']);
  assert.equal(entriesInPeriod(entries, 0).length, 5);
});

test('default date respects the browser calendar around midnight', () => {
  const original = process.env.TZ;
  try {
    process.env.TZ = 'America/Fortaleza';
    assert.equal(localDate(new Date('2026-10-07T01:00:00Z')), '2026-10-06');
  } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
});

test('a report for the last 7 days excludes old records even with sparse history', () => {
  const entry = { ...generateInitialSeedEntries()[0], date: '2020-01-01', isDemo: false };
  assert.match(buildDeterministicReport([entry], [], 'Teste', 7), /Nenhum registro/);
  assert.match(buildDeterministicReport([entry], [], 'Teste', 0), /2020-01-01/);
});

test('reports do not describe higher anxiety on workout days as a reduction', () => {
  const entry = { ...generateInitialSeedEntries()[0], isDemo: false };
  const report = buildDeterministicReport([
    { ...entry, id: 'with', date: localDate(), anxietyLevel: 5, physicalActivities: [{ type: 'Corrida', durationMinutes: 30, intensity: 'light' }] },
    { ...entry, id: 'without', date: localDate(), anxietyLevel: 1, physicalActivities: [] },
  ], [], 'Teste', 0);
  assert.match(report, /1 de 2 registros mencionam atividade física/);
  assert.match(report, /Não é possível atribuir mudanças no humor ao exercício/);
  assert.doesNotMatch(report, /caiu para|evidenciando o efeito/);
});
