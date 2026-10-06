import assert from "node:assert/strict";
import { test } from "node:test";
import { validateEntries } from "../src/services/validation";
import { generateInitialSeedEntries } from "../src/services/storage";
import {
  describeEntries,
  measurementSummary,
  buildDeterministicReport,
  moodLabel,
  impulseLabel,
} from "../src/services/observations";
const entry = (patch: Record<string, unknown> = {}) =>
  validateEntries([
    {
      ...generateInitialSeedEntries()[0],
      id: "real",
      schemaVersion: 3,
      isDemo: false,
      moodScale: "valence",
      recordKind: "moment",
      moodScore: null,
      activationLevel: null,
      sleepHours: null,
      sleepQuality: null,
      energyLevel: null,
      anxietyLevel: null,
      irritabilityLevel: null,
      isMixedState: null,
      ...patch,
    },
  ])[0];
test("nullable measurements survive validation and missing legacy fields are not imputed", () => {
  const incomplete = entry();
  for (const key of [
    "moodScore",
    "activationLevel",
    "sleepHours",
    "sleepQuality",
    "energyLevel",
    "anxietyLevel",
    "irritabilityLevel",
    "isMixedState",
  ] as const)
    assert.equal(incomplete[key], null);
  const old = validateEntries([
    { id: "old", date: "2026-10-06", moodScore: 2 },
  ])[0];
  assert.equal(old.moodScale, "legacy");
  assert.equal(old.sleepHours, null);
  assert.equal(old.energyLevel, null);
  assert.equal(moodLabel(old), "Muito Animado / Disposto");
  assert.equal(moodLabel(entry({ moodScore: 2 })), "Agradável");
});
test("zero is a real observation and an unknown answer is excluded from means", () => {
  const values = [
    entry({ id: "a", anxietyLevel: 0 }),
    entry({ id: "b", anxietyLevel: null }),
    entry({ id: "c", anxietyLevel: 4 }),
  ];
  assert.deepEqual(measurementSummary(values, "anxietyLevel"), {
    count: 2,
    days: 1,
    missing: 1,
    mean: 2,
  });
  assert.equal(measurementSummary([entry()], "moodScore").mean, null);
});
test("multiple observations are counted as records, not independent days, and old scales stay separate", () => {
  const values = [
    entry({ id: "moment1", moodScore: -2 }),
    entry({ id: "moment2", moodScore: 2, activationLevel: 5 }),
    entry({ id: "daily", recordKind: "daily_summary", moodScore: 0 }),
    entry({
      id: "legacy",
      moodScale: "legacy",
      recordKind: undefined,
      moodScore: 3,
    }),
    { ...generateInitialSeedEntries()[0] },
  ];
  const analysis = describeEntries(values);
  assert.match(
    analysis.resumo_geral,
    /4 registros em 1 dias: 2 momentos, 1 resumos do dia e 1 registros antigos/,
  );
  assert.match(analysis.patterns![0], /3 respostas em 1 dias/);
  assert.match(analysis.patterns![3], /1 registros da escala antiga/);
});
test("frequent strategy use alone is not treated as helpful and labels are neutral", () => {
  const unknown = entry({
    protectiveFactors: ["Pausa"],
    strategyEffect: undefined,
  });
  assert.deepEqual(describeEntries([unknown]).protecoes_mais_eficazes, []);
  assert.deepEqual(
    describeEntries([{ ...unknown, strategyEffect: "not_helped" }])
      .protecoes_mais_eficazes,
    [],
  );
  assert.deepEqual(
    describeEntries([{ ...unknown, strategyEffect: "helped" }])
      .protecoes_mais_eficazes,
    ["Pausa: 1 de 1 registros"],
  );
  assert.equal(
    impulseLabel({
      id: "i",
      type: "Compra",
      intensity: null,
      outcome: "acted",
    }),
    "Realizei a ação",
  );
  assert.equal(
    impulseLabel({ id: "i", type: "Compra", intensity: null }),
    "Desfecho não informado",
  );
  assert.equal(
    impulseLabel({
      id: "i",
      type: "Compra",
      intensity: 1,
      resisted: "delayed",
    }),
    "Adiei a ação (registro antigo)",
  );
});
test("report distinguishes explicit no impulses from unobserved and excludes demo data", () => {
  const report = buildDeterministicReport(
    [
      entry(),
      entry({ id: "no", observedSections: ["impulses"] }),
      generateInitialSeedEntries()[0],
    ],
    [],
    "Teste",
    0,
  );
  assert.match(report, /2 registros em 1 dias/);
  assert.match(report, /1 respostas explícitas sem ocorrência/);
  assert.match(report, /1 exemplos fictícios excluídos/);
  assert.match(report, /Sono médio: não informada/);
});
test("invalid new fields are rejected before import or persistence", () => {
  for (const patch of [
    { activationLevel: 8 },
    { contexts: "wrong" },
    { observedSections: ["whatever"] },
    { strategyEffect: "effective" },
    { recordKind: "day" },
    { moodScale: "anything" },
    { isDemo: "false" },
    { moodScore: 0.5 },
  ])
    assert.throws(() => entry(patch));
  assert.throws(() =>
    entry({ medicationIntakes: [{ medicationId: "m", medicationName: "M" }] }),
  );
  const values = entry({
    physicalActivities: [{ type: "", durationMinutes: null, intensity: null }],
    impulsiveBehaviors: [{ id: "i", type: "", intensity: null }],
  });
  assert.equal(values.physicalActivities![0].durationMinutes, null);
  assert.equal(values.impulsiveBehaviors[0].resisted, undefined);
});
