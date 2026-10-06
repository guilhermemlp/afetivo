import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  clearAllUserData, exportDataAsJSON, exportDataAsCSV, generateInitialSeedEntries,
  importDataFromJSON, loadEntries, loadMedications, resetAllDataToDemo, saveEntries, saveMedications,
} from '../src/services/storage';

let values: Map<string, string>;
let failKey: string | null;
beforeEach(() => {
  values = new Map(); failKey = null;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (key === failKey) { failKey = null; throw new Error('QuotaExceededError'); }
      values.set(key, value);
    },
    removeItem: (key: string) => values.delete(key),
  } });
});

test('clearing a diary stays empty after loading and exporting', () => {
  resetAllDataToDemo();
  clearAllUserData();
  assert.deepEqual(loadEntries(), []);
  assert.deepEqual(loadMedications(), []);
  const backup = JSON.parse(exportDataAsJSON());
  assert.deepEqual(backup.entries, []);
  assert.deepEqual(backup.medications, []);
});

test('deleting all medications does not restore the demonstration list', () => {
  saveMedications([]);
  assert.deepEqual(loadMedications(), []);
});

test('user-written medication names and notes survive a save/load/backup round trip', () => {
  const entry = generateInitialSeedEntries()[0];
  entry.journalNotes = 'Conversei com meu psiquiatra sobre os remédios.';
  entry.medicationIntakes[0].medicationName = 'Estabilizador prescrito';
  saveEntries([entry]);
  saveMedications([{ id: 'personal', name: 'Estabilizador prescrito', category: 'mood_stabilizer', dosage: '1 dose', frequency: 'daily_night', active: true }]);
  const backup = exportDataAsJSON();
  clearAllUserData();
  assert.equal(importDataFromJSON(backup).success, true);
  assert.equal(loadEntries()[0].journalNotes, entry.journalNotes);
  assert.equal(loadEntries()[0].medicationIntakes[0].medicationName, 'Estabilizador prescrito');
  assert.equal(loadMedications()[0].name, 'Estabilizador prescrito');
});

test('malformed nested backup data is rejected without replacing existing data', () => {
  resetAllDataToDemo();
  const before = new Map(values);
  const entry = { ...generateInitialSeedEntries()[0], physicalActivities: 'invalid' };
  assert.equal(importDataFromJSON(JSON.stringify({ entries: [entry], medications: [] })).success, false);
  assert.deepEqual(values, before);
});

test('an invalid medication section prevents the entry section from being written', () => {
  resetAllDataToDemo();
  const before = new Map(values);
  assert.equal(importDataFromJSON(JSON.stringify({ entries: [], medications: [{ id: 'missing-name' }] })).success, false);
  assert.deepEqual(values, before);
});

test('a failed multi-section import restores previous data and reports failure', () => {
  resetAllDataToDemo();
  const before = new Map(values);
  failKey = 'afetivo_medications_v2';
  assert.equal(importDataFromJSON(JSON.stringify({ entries: [], medications: [] })).success, false);
  assert.deepEqual(values, before);
});

test('write failures propagate instead of pretending the data was saved', () => {
  failKey = 'afetivo_entries_v2';
  assert.throws(() => saveEntries([]), /QuotaExceededError/);
});

test('an empty legacy diary migrates without reseeding demonstration records', () => {
  values.set('afetivo_entries_v1', '[]');
  values.set('afetivo_medications_v1', '[]');
  assert.deepEqual(loadEntries(), []);
  assert.deepEqual(loadMedications(), []);
});

test('CSV quotes multiline text and neutralizes spreadsheet formulas', () => {
  const entry = generateInitialSeedEntries()[0];
  entry.journalNotes = '=HYPERLINK("https://example.com")\nsecond line';
  saveEntries([entry]);
  const csv = exportDataAsCSV();
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.com"")\nsecond line"'));
});

test('duplicate IDs and impossible dates cannot be imported', () => {
  const entry = generateInitialSeedEntries()[0];
  assert.equal(importDataFromJSON(JSON.stringify([entry, entry])).success, false);
  assert.equal(importDataFromJSON(JSON.stringify([{ ...entry, date: '2026-02-30' }])).success, false);
});

test('a new browser starts empty without demo medications or mood observations', () => {
  assert.deepEqual(loadEntries(), []);
  assert.deepEqual(loadMedications(), []);
});

test('unchanged old demo fixtures are identified without marking edited personal notes as demo', () => {
  const { isDemo, moodScale, ...old } = generateInitialSeedEntries()[0];
  values.set('afetivo_entries_v2', JSON.stringify([old]));
  assert.equal(loadEntries()[0].isDemo, true);
  values.set('afetivo_entries_v2', JSON.stringify([{ ...old, journalNotes: 'Meu registro pessoal editado.' }]));
  assert.equal(loadEntries()[0].isDemo, false);
  assert.equal(loadEntries()[0].journalNotes, 'Meu registro pessoal editado.');
});

test('new fields and explicit unknowns survive JSON and CSV exports', () => {
  const base = generateInitialSeedEntries()[0];
  saveEntries([{ ...base, schemaVersion: 3, isDemo: false, moodScale: 'valence', recordKind: 'moment', moodScore: null, activationLevel: 4, sleepHours: null, contexts: ['Interrupções'], strategyEffect: 'partly', observedSections: ['context', 'support'], nextStep: 'Uma etapa', physicalActivities: [{ type: 'Caminhada', durationMinutes: null, intensity: null }], impulsiveBehaviors: [] }]);
  const backup = exportDataAsJSON();
  assert.equal(JSON.parse(backup).version, '3.0');
  clearAllUserData();
  assert.equal(importDataFromJSON(backup).success, true);
  const record = loadEntries()[0];
  assert.equal(record.moodScore, null);
  assert.equal(record.activationLevel, 4);
  assert.equal(record.recordKind, 'moment');
  assert.equal(record.sleepHours, null);
  assert.equal(record.nextStep, 'Uma etapa');
  const csv = exportDataAsCSV();
  assert.match(csv, /Escala_Humor,Tipo_Registro,Ativacao_1a5/);
  assert.match(csv, /"valence","moment","4","Interrupções","Uma etapa","partly"/);
  assert.doesNotMatch(csv, /nullmin|Dose padrão|Adiou 15min/);
});
