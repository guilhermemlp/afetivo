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
    "mentalClarityLevel",
    "hyperfocusPresent",
    "hyperfocusNotes",
    "unmetIntentionNotes",
    "domainFlags",
    "domainOther",
    "anxietyScore",
    "stressScore",
    "sadnessScore",
    "urgeScore",
    "isolationScore",
    "compulsionLevel",
    "urgeDescription",
    "behaviorDescription",
    "behaviorFunctions",
    "behaviorFunctionNote",
    "consequence",
    "impulsiveSpending",
    "timeToBaseline",
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
  assert.match(
    analysis.patterns!.find((pattern) => pattern.includes("escala antiga"))!,
    /1 registros da escala antiga/,
  );
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
    { mentalClarityLevel: 6 },
    { mentalClarityLevel: 2.5 },
    { hyperfocusPresent: "sim" },
    { hyperfocusNotes: 3 },
    { unmetIntentionNotes: [] },
    { domainFlags: "financeiro" },
    { domainFlags: [""] },
    { anxietyScore: 11 },
    { stressScore: -1 },
    { sadnessScore: 2.5 },
    { urgeScore: "7" },
    { isolationScore: Infinity },
    { compulsionLevel: "high" },
    { behaviorFunctions: "Escapar da realidade" },
    { behaviorFunctions: [3] },
    { behaviorFunctionNote: [] },
    { impulsiveSpending: -0.01 },
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

test("focus fields remain descriptive and distinguish no from missing", () => {
  const values = [
    entry({
      id: "focus",
      mentalClarityLevel: 2,
      hyperfocusPresent: true,
      hyperfocusNotes: "Organizando referências",
      unmetIntentionNotes: "Responder uma mensagem",
      observedSections: ["focus"],
    }),
    entry({ id: "no-focus", hyperfocusPresent: false }),
    entry({ id: "missing-focus" }),
  ];
  assert.match(describeEntries(values).patterns!.join("\n"), /Clareza mental: 1 respostas; 2 sem resposta/);
  const report = buildDeterministicReport(values, [], "Teste", 0);
  assert.match(report, /Clareza mental: 2\/5/);
  assert.match(report, /Hiperfoco percebido: sim; descrição: Organizando referências/);
  assert.match(report, /Atividade pretendida e não concluída: Responder uma mensagem/);
  assert.match(report, /Hiperfoco percebido: não\./);
  assert.match(report, /Hiperfoco percebido: não informado\./);
});

test("behavior chain stays descriptive and supports multiple functions", () => {
  const values = [
    entry({
      id: "high",
      domainFlags: ["relacionamentos", "financeiro"],
      anxietyScore: 8,
      stressScore: 9,
      sadnessScore: 5,
      urgeScore: 7,
      isolationScore: 6,
      compulsionLevel: "mild",
      urgeDescription: "Vontade de comprar",
      behaviorDescription: "Fiz uma compra",
      behaviorFunctions: [
        "Aliviar tensão / ansiedade",
        "Sentir algum controle",
      ],
      behaviorFunctionNote: "Organizar uma sensação difícil",
      consequence: "Alívio breve",
      impulsiveSpending: 42.5,
      timeToBaseline: "40 minutos",
    }),
    entry({
      id: "lower",
      domainFlags: ["financeiro"],
      anxietyScore: 4,
      compulsionLevel: "none",
      behaviorFunctions: ["Aliviar tensão / ansiedade"],
    }),
    entry({ id: "missing-chain" }),
  ];
  const analysis = describeEntries(values);
  assert.deepEqual(analysis.funcoes_comportamento_frequentes, [
    "Aliviar tensão / ansiedade: 2 de 2 registros",
    "Sentir algum controle: 1 de 2 registros",
  ]);
  assert.deepEqual(analysis.dominios_mais_ativados, [
    "Dinheiro / financeiro: 2 de 3 registros",
    "Relacionamentos: 1 de 3 registros",
  ]);
  assert.match(analysis.escalas_e_compulsao![0], /1 de 1 registros em 7–10/);
  assert.match(analysis.escalas_e_compulsao![0], /abaixo de 7, 0 de 1/);
  const report = buildDeterministicReport(values, [], "Teste", 0);
  assert.match(report, /FUNÇÕES PERCEBIDAS DO COMPORTAMENTO/);
  assert.match(
    report,
    /Funções percebidas: Aliviar tensão \/ ansiedade, Sentir algum controle/,
  );
  assert.match(report, /Gasto impulsivo registrado: R\$ 42\.50/);
  assert.match(report, /Associação descritiva, sem inferência de causa/);
});
