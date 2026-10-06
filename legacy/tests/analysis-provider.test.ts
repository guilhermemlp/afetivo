import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzePatternsLocally,
  analyzeWithProvider,
  type PatternAnalysisProvider,
} from '../src/services/analysisProvider';
import { describeEntries } from '../src/services/observations';
import { generateInitialSeedEntries } from '../src/services/storage';

test('local provider excludes demonstration entries and sends nothing externally', () => {
  const demo = generateInitialSeedEntries()[0];
  const personal = {
    ...demo,
    id: 'personal',
    isDemo: false,
    date: '2026-10-06',
  };
  const result = analyzePatternsLocally({
    entries: [demo, personal],
    timeFrameDays: 30,
    referenceDate: new Date('2026-10-06T12:00:00'),
  });

  assert.equal(result.providerId, 'local');
  assert.equal(result.entriesAnalyzed, 1);
  assert.match(result.analysis.resumo_geral, /^1 registros em 1 dias:/);
});

test('a future provider can implement the neutral analysis contract', async () => {
  const request = { entries: [], timeFrameDays: 14 };
  let receivedRequest = false;
  const futureProvider: PatternAnalysisProvider = {
    id: 'future-provider',
    async analyze(received) {
      receivedRequest = received === request;
      return {
        providerId: this.id,
        analysis: describeEntries([]),
        entriesAnalyzed: 0,
      };
    },
  };

  const result = await analyzeWithProvider(request, futureProvider);
  assert.equal(receivedRequest, true);
  assert.equal(result.providerId, 'future-provider');
});
