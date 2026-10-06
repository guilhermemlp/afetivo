import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  clearEntryDraft,
  ENTRY_DRAFT_STORAGE_KEY,
  loadEntryDraft,
  saveEntryDraft,
} from '../src/services/entryDraft';
import { generateInitialSeedEntries } from '../src/services/storage';

let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
});

test('entry draft preserves nullable answers and quick-mode state', () => {
  const entry = {
    ...generateInitialSeedEntries()[0],
    id: 'personal-draft',
    isDemo: false,
    moodScore: null,
    activationLevel: null,
    anxietyScore: 8,
    domainFlags: ['relacionamentos'],
    behaviorFunctions: [
      'Aliviar tensão / ansiedade',
      'Sentir algum controle',
    ],
  };
  assert.equal(saveEntryDraft(entry, true), true);
  const restored = loadEntryDraft();
  assert.equal(restored?.entry.id, 'personal-draft');
  assert.equal(restored?.entry.moodScore, null);
  assert.equal(restored?.entry.activationLevel, null);
  assert.equal(restored?.entry.anxietyScore, 8);
  assert.deepEqual(restored?.entry.domainFlags, ['relacionamentos']);
  assert.deepEqual(restored?.entry.behaviorFunctions, [
    'Aliviar tensão / ansiedade',
    'Sentir algum controle',
  ]);
  assert.equal(restored?.showDetails, true);
});

test('invalid or demonstration drafts are discarded', () => {
  values.set(ENTRY_DRAFT_STORAGE_KEY, '{invalid');
  assert.equal(loadEntryDraft(), null);
  assert.equal(values.has(ENTRY_DRAFT_STORAGE_KEY), false);

  const demo = generateInitialSeedEntries()[0];
  assert.equal(saveEntryDraft(demo, false), false);
  assert.equal(loadEntryDraft(), null);
});

test('clearing a draft removes only its versioned key', () => {
  values.set(ENTRY_DRAFT_STORAGE_KEY, '{}');
  values.set('unrelated', 'preserved');
  clearEntryDraft();
  assert.equal(values.has(ENTRY_DRAFT_STORAGE_KEY), false);
  assert.equal(values.get('unrelated'), 'preserved');
});
