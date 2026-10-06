import React, { useState } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';
import { X, Trash2 } from 'lucide-react';
import {
  AfetivoEntry,
  Medication,
  MoodScore,
  ImpulsiveBehavior,
  PhysicalActivity,
} from '../types/mood';
import {
  CONTEXT_OPTIONS,
  VALENCE_LABELS,
  OUTCOME_LABELS,
  EFFECT_LABELS,
  moodLabel,
} from '../services/observations';
import { localDate, isValidDate } from '../services/dates';

interface Props {
  medications: Medication[];
  initialEntry?: AfetivoEntry | null;
  onSave: (entry: AfetivoEntry) => Promise<boolean> | boolean;
  onClose: () => void;
}
const field =
  'w-full border border-stone-300 dark:border-stone-700 rounded-lg p-2 bg-white dark:bg-stone-900';
const button =
  'border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-2 cursor-pointer aria-pressed:bg-teal-100 dark:aria-pressed:bg-teal-900';
const blankEntry = (): AfetivoEntry => ({
  id: crypto.randomUUID(),
  schemaVersion: 3,
  moodScale: 'valence',
  recordKind: 'moment',
  isDemo: false,
  date: localDate(),
  time: new Date().toTimeString().slice(0, 5),
  moodScore: null,
  moodLabel: 'Não informado',
  activationLevel: null,
  isMixedState: null,
  energyLevel: null,
  anxietyLevel: null,
  irritabilityLevel: null,
  sleepHours: null,
  sleepQuality: null,
  emotions: [],
  somaticSymptoms: [],
  triggers: [],
  activities: [],
  physicalActivities: [],
  impulsiveBehaviors: [],
  medicationIntakes: [],
  contexts: [],
  observedSections: [],
  protectiveFactors: [],
  journalNotes: '',
  createdAt: Date.now(),
});
export const QuickMoodLogger: React.FC<Props> = ({
  medications,
  initialEntry,
  onSave,
  onClose,
}) => {
  const modalRef = useModalFocus(onClose);
  const [entry, setEntry] = useState<AfetivoEntry>(() =>
    initialEntry ? { ...initialEntry } : blankEntry(),
  );
  const [emotionText, setEmotionText] = useState(entry.emotions.join(', '));
  const [supportText, setSupportText] = useState(
    entry.protectiveFactors?.join(', ') ?? '',
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const change = (patch: Partial<AfetivoEntry>) =>
    setEntry((e) => ({ ...e, ...patch }));
  const observed = (
    section: NonNullable<AfetivoEntry['observedSections']>[number],
    patch: Partial<AfetivoEntry>,
  ) =>
    setEntry((e) => ({
      ...e,
      ...patch,
      observedSections: [...new Set([...(e.observedSections ?? []), section])],
    }));
  const toggle = (
    key: 'contexts' | 'emotions' | 'protectiveFactors',
    value: string,
    section: NonNullable<AfetivoEntry['observedSections']>[number],
  ) =>
    observed(section, {
      [key]: (entry[key] ?? []).includes(value)
        ? (entry[key] ?? []).filter((v) => v !== value)
        : [...(entry[key] ?? []), value],
    });
  const save = async () => {
    setError('');
    if (
      !isValidDate(entry.date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.time)
    ) {
      setError('Informe uma data e um horário válidos.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...entry, moodLabel: moodLabel(entry) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };
  const impulse = (id: string, patch: Partial<ImpulsiveBehavior>) =>
    observed('impulses', {
      impulsiveBehaviors: entry.impulsiveBehaviors.map((i) =>
        i.id === id ? { ...i, ...patch } : i,
      ),
    });
  const workout = (index: number, patch: Partial<PhysicalActivity>) =>
    observed('activities', {
      physicalActivities: (entry.physicalActivities ?? []).map((w, i) =>
        i === index ? { ...w, ...patch } : w,
      ),
    });
  const historicalMeds = entry.medicationIntakes
    .filter((i) => !medications.some((m) => m.id === i.medicationId))
    .map((i) => ({
      id: i.medicationId,
      name: i.medicationName,
      active: false,
    }));
  const shownMeds = [
    ...medications.filter(
      (m) =>
        m.active ||
        entry.medicationIntakes.some((i) => i.medicationId === m.id),
    ),
    ...historicalMeds,
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
      <section
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logger-title"
        className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
      >
        <header className="flex justify-between items-center border-b p-4">
          <h2 id="logger-title" className="font-semibold text-lg">
            {initialEntry ? 'Editar registro' : 'Como está este momento?'}
          </h2>
          <button
            aria-label="Fechar registro"
            onClick={onClose}
            className={button}
          >
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto p-4 space-y-5">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Duas perguntas para começar. Você pode pular qualquer uma e salvar
            só o que fizer sentido. Não é preciso escrever nem manter uma
            sequência de dias.
          </p>
          {entry.isDemo && (
            <p className="text-sm text-amber-700">
              Este é um exemplo fictício. A edição continua marcada como
              demonstração.
            </p>
          )}
          <div className="grid sm:grid-cols-3 gap-3">
            <label>
              Data
              <input
                aria-label="Data"
                className={field}
                type="date"
                value={entry.date}
                onChange={(e) => change({ date: e.target.value })}
              />
            </label>
            <label>
              Horário
              <input
                aria-label="Horário"
                className={field}
                type="time"
                value={entry.time}
                onChange={(e) => change({ time: e.target.value })}
              />
            </label>
            <label>
              Tipo de registro
              <select
                aria-label="Tipo de registro"
                className={field}
                value={entry.recordKind ?? 'legacy'}
                onChange={(e) =>
                  change({
                    recordKind: e.target.value as AfetivoEntry['recordKind'],
                  })
                }
              >
                {!entry.recordKind && (
                  <option value="legacy">Antigo, sem tipo definido</option>
                )}
                <option value="moment">Este momento</option>
                <option value="daily_summary">Resumo do dia</option>
              </select>
            </label>
          </div>
          <fieldset className="space-y-2">
            <legend className="font-semibold">1. Como você se sente?</legend>
            <p className="text-sm">
              Agradável ou desagradável — independente de estar calmo ou
              acelerado.
            </p>
            {entry.moodScale !== 'valence' && (
              <p className="text-sm text-amber-700">
                Escala antiga preservada: {moodLabel(entry)}. Escolher uma
                resposta abaixo troca a escala deste registro.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {([-3, -2, -1, 0, 1, 2, 3] as MoodScore[]).map((n) => (
                <button
                  key={n}
                  className={`${button} ${entry.moodScale === 'valence' && entry.moodScore === n ? 'bg-teal-100 dark:bg-teal-900' : ''}`}
                  aria-pressed={
                    entry.moodScale === 'valence' && entry.moodScore === n
                  }
                  onClick={() => change({ moodScore: n, moodScale: 'valence' })}
                >
                  {VALENCE_LABELS[n]}
                </button>
              ))}
              <button
                className={button}
                aria-pressed={entry.moodScore == null}
                onClick={() =>
                  change({ moodScore: null, moodScale: 'valence' })
                }
              >
                Não sei / pular humor
              </button>
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="font-semibold">
              2. Quanta ativação você percebe?
            </legend>
            <p className="text-sm">
              De pouco ativado a muito ativado ou acelerado. Ativação alta pode
              ser agradável ou desagradável.
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-label={`Ativação ${n}`}
                  aria-pressed={entry.activationLevel === n}
                  className={`${button} ${entry.activationLevel === n ? 'bg-teal-100 dark:bg-teal-900' : ''}`}
                  onClick={() => change({ activationLevel: n })}
                >
                  {n}
                  {n === 1 ? ' · Pouca' : n === 5 ? ' · Muita' : ''}
                </button>
              ))}
              <button
                className={button}
                aria-pressed={entry.activationLevel == null}
                onClick={() => change({ activationLevel: null })}
              >
                Não sei / pular ativação
              </button>
            </div>
          </fieldset>
          <p className="text-sm">
            Os detalhes abaixo são opcionais. Abrir uma seção não registra uma
            resposta.
          </p>
          <details>
            <summary className="cursor-pointer font-semibold py-2">
              Contexto e emoções
            </summary>
            <div className="space-y-3 py-3">
              <p className="text-sm">
                O que estava acontecendo? Isso é contexto, não uma causa
                comprovada.
              </p>
              <div className="flex flex-wrap gap-2">
                {CONTEXT_OPTIONS.map((v) => (
                  <button
                    key={v}
                    aria-pressed={entry.contexts?.includes(v) ?? false}
                    className={button}
                    onClick={() => toggle('contexts', v, 'context')}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-sm">
                Se quiser, escolha emoções ou escreva as suas.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Alegria',
                  'Tranquilidade',
                  'Entusiasmo',
                  'Frustração',
                  'Tristeza',
                  'Ansiedade',
                  'Irritação',
                  'Cansaço',
                ].map((value) => (
                  <button
                    key={value}
                    className={button}
                    aria-pressed={entry.emotions.includes(value)}
                    onClick={() => {
                      const next = entry.emotions.includes(value)
                        ? entry.emotions.filter((v) => v !== value)
                        : [...entry.emotions, value];
                      observed('context', { emotions: next });
                      setEmotionText(next.join(', '));
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <label>
                Emoções (separadas por vírgula)
                <input
                  className={field}
                  value={emotionText}
                  onChange={(e) => {
                    setEmotionText(e.target.value);
                    observed('context', {
                      emotions: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    });
                  }}
                />
              </label>
            </div>
          </details>
          <details>
            <summary className="cursor-pointer font-semibold py-2">
              Sono e disposição
            </summary>
            <div className="space-y-3 py-3">
              <p className="text-sm">
                Se souber, informe o sono da última noite. Deixar em branco
                mantém “não informado”.
              </p>
              <label>
                Horas de sono
                <input
                  aria-label="Horas de sono"
                  type="number"
                  min="0"
                  max="24"
                  step="0.25"
                  className={field}
                  value={entry.sleepHours ?? ''}
                  onChange={(e) =>
                    observed('sleep', {
                      sleepHours:
                        e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Qualidade do sono
                <select
                  className={field}
                  value={entry.sleepQuality ?? ''}
                  onChange={(e) =>
                    observed('sleep', {
                      sleepQuality: (e.target.value ||
                        null) as AfetivoEntry['sleepQuality'],
                    })
                  }
                >
                  <option value="">Não informado</option>
                  <option value="poor">Ruim</option>
                  <option value="fair">Regular</option>
                  <option value="good">Boa</option>
                  <option value="restorative">Restauradora</option>
                </select>
              </label>
              {(
                ['energyLevel', 'anxietyLevel', 'irritabilityLevel'] as const
              ).map((key, index) => (
                <label key={key} className="block">
                  {
                    [
                      'Energia física (1 a 5)',
                      'Ansiedade (0 a 5)',
                      'Irritabilidade (0 a 5)',
                    ][index]
                  }
                  <input
                    type="number"
                    min={key === 'energyLevel' ? 1 : 0}
                    max="5"
                    step="1"
                    className={field}
                    value={entry[key] ?? ''}
                    onChange={(e) =>
                      change({
                        [key]:
                          e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </details>
          <details>
            <summary className="cursor-pointer font-semibold py-2">
              Impulsos — sem julgamento
            </summary>
            <div className="space-y-3 py-3">
              <p className="text-sm">
                Sem resposta é diferente de não ter percebido impulsos.
              </p>
              {entry.impulsiveBehaviors.map((i) => (
                <div key={i.id} className="border rounded-lg p-3 space-y-2">
                  <label>
                    O que percebeu?
                    <input
                      className={field}
                      value={i.type}
                      onChange={(e) => impulse(i.id, { type: e.target.value })}
                    />
                  </label>
                  <label>
                    Intensidade percebida (1 a 5)
                    <input
                      className={field}
                      type="number"
                      min="1"
                      max="5"
                      value={i.intensity ?? ''}
                      onChange={(e) =>
                        impulse(i.id, {
                          intensity:
                            e.target.value === ''
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    O que aconteceu?
                    <select
                      className={field}
                      value={i.outcome ?? ''}
                      onChange={(e) =>
                        impulse(i.id, {
                          outcome: (e.target.value ||
                            undefined) as ImpulsiveBehavior['outcome'],
                        })
                      }
                    >
                      <option value="">
                        Não informado
                        {i.resisted ? ' (desfecho antigo preservado)' : ''}
                      </option>
                      {Object.entries(OUTCOME_LABELS).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Estratégia escolhida (opcional)
                    <input
                      className={field}
                      value={i.copingUsed ?? ''}
                      onChange={(e) =>
                        impulse(i.id, { copingUsed: e.target.value })
                      }
                    />
                  </label>
                  <button
                    className={button}
                    aria-label="Remover impulso"
                    onClick={() =>
                      change({
                        impulsiveBehaviors: entry.impulsiveBehaviors.filter(
                          (v) => v.id !== i.id,
                        ),
                        observedSections: entry.observedSections?.filter(
                          (v) => v !== 'impulses',
                        ),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <button
                  className={button}
                  onClick={() =>
                    observed('impulses', {
                      impulsiveBehaviors: [
                        ...entry.impulsiveBehaviors,
                        { id: crypto.randomUUID(), type: '', intensity: null },
                      ],
                    })
                  }
                >
                  Adicionar impulso
                </button>
                <button
                  className={button}
                  onClick={() =>
                    observed('impulses', { impulsiveBehaviors: [] })
                  }
                >
                  Não percebi impulsos
                </button>
                <button
                  className={button}
                  onClick={() =>
                    change({
                      impulsiveBehaviors: [],
                      observedSections: entry.observedSections?.filter(
                        (v) => v !== 'impulses',
                      ),
                    })
                  }
                >
                  Deixar impulsos sem resposta
                </button>
              </div>
              <p role="status" className="text-sm">
                {entry.impulsiveBehaviors.length
                  ? `${entry.impulsiveBehaviors.length} ocorrência(s)`
                  : entry.observedSections?.includes('impulses')
                    ? 'Resposta: não percebi impulsos.'
                    : 'Impulsos não informados.'}
              </p>
            </div>
          </details>
          <details>
            <summary className="cursor-pointer font-semibold py-2">
              Atividade física
            </summary>
            <div className="space-y-3 py-3">
              {(entry.physicalActivities ?? []).map((w, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <label>
                    Atividade
                    <input
                      className={field}
                      value={w.type}
                      onChange={(e) => workout(index, { type: e.target.value })}
                    />
                  </label>
                  <label>
                    Duração em minutos
                    <input
                      className={field}
                      type="number"
                      min="1"
                      max="1440"
                      value={w.durationMinutes ?? ''}
                      onChange={(e) =>
                        workout(index, {
                          durationMinutes:
                            e.target.value === ''
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Intensidade
                    <select
                      className={field}
                      value={w.intensity ?? ''}
                      onChange={(e) =>
                        workout(index, {
                          intensity: (e.target.value ||
                            null) as PhysicalActivity['intensity'],
                        })
                      }
                    >
                      <option value="">Não informada</option>
                      <option value="light">Leve</option>
                      <option value="moderate">Moderada</option>
                      <option value="vigorous">Intensa</option>
                    </select>
                  </label>
                  <button
                    className={button}
                    aria-label="Remover atividade"
                    onClick={() =>
                      change({
                        physicalActivities: (
                          entry.physicalActivities ?? []
                        ).filter((_, n) => n !== index),
                        observedSections: entry.observedSections?.filter(
                          (v) => v !== 'activities',
                        ),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                className={button}
                onClick={() =>
                  observed('activities', {
                    physicalActivities: [
                      ...(entry.physicalActivities ?? []),
                      {
                        id: crypto.randomUUID(),
                        type: '',
                        durationMinutes: null,
                        intensity: null,
                      },
                    ],
                  })
                }
              >
                Adicionar atividade
              </button>
            </div>
          </details>
          <details>
            <summary className="cursor-pointer font-semibold py-2">
              Medicações e rotina
            </summary>
            <div className="space-y-3 py-3">
              <p className="text-sm">
                Nenhum item é marcado automaticamente. Registre apenas o que
                sabe; o diário não sugere doses.
              </p>
              {shownMeds.map((m) => (
                <label key={m.id} className="block">
                  {m.name}
                  {!m.active ? ' (histórico / pausado)' : ''}
                  <select
                    aria-label={`Uso de ${m.name}`}
                    className={field}
                    value={
                      entry.medicationIntakes.find(
                        (i) => i.medicationId === m.id,
                      )?.status ?? ''
                    }
                    onChange={(e) =>
                      observed('medications', {
                        medicationIntakes: [
                          ...entry.medicationIntakes.filter(
                            (i) => i.medicationId !== m.id,
                          ),
                          ...(e.target.value
                            ? [
                                {
                                  ...entry.medicationIntakes.find(
                                    (i) => i.medicationId === m.id,
                                  ),
                                  medicationId: m.id,
                                  medicationName: m.name,
                                  status: e.target
                                    .value as AfetivoEntry['medicationIntakes'][number]['status'],
                                },
                              ]
                            : []),
                        ],
                      })
                    }
                  >
                    <option value="">Não informado</option>
                    <option value="taken">Tomado / realizado</option>
                    <option value="skipped">Não tomado / realizado</option>
                    <option value="delayed">Atrasado</option>
                    <option value="extra_dose">
                      Dose adicional já utilizada
                    </option>
                  </select>
                </label>
              ))}
              {!shownMeds.length && <p>Nenhum item ativo cadastrado.</p>}
            </div>
          </details>
          <details>
            <summary className="cursor-pointer font-semibold py-2">
              Apoio e próximo passo
            </summary>
            <div className="space-y-3 py-3">
              <label>
                O que você experimentou ou recebeu como apoio?
                <textarea
                  className={field}
                  value={entry.whatHelpedNotes ?? ''}
                  onChange={(e) =>
                    observed('support', { whatHelpedNotes: e.target.value })
                  }
                />
              </label>
              <label>
                Apoios (separados por vírgula)
                <input
                  className={field}
                  value={supportText}
                  onChange={(e) => {
                    setSupportText(e.target.value);
                    observed('support', {
                      protectiveFactors: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    });
                  }}
                />
              </label>
              <label>
                Como foi para você?
                <select
                  aria-label="Avaliação do apoio"
                  className={field}
                  value={entry.strategyEffect ?? ''}
                  onChange={(e) =>
                    observed('support', {
                      strategyEffect: (e.target.value ||
                        undefined) as AfetivoEntry['strategyEffect'],
                    })
                  }
                >
                  <option value="">Não avaliei</option>
                  {Object.entries(EFFECT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Um próximo passo escolhido por você (opcional)
                <input
                  className={field}
                  value={entry.nextStep ?? ''}
                  onChange={(e) =>
                    observed('support', { nextStep: e.target.value })
                  }
                />
              </label>
            </div>
          </details>
          <details>
            <summary className="cursor-pointer font-semibold py-2">
              Notas livres
            </summary>
            <label className="block py-3">
              Algo que você quer guardar? Não precisa escrever.
              <textarea
                aria-label="Notas livres"
                className={field}
                rows={3}
                value={entry.journalNotes}
                onChange={(e) =>
                  observed('notes', { journalNotes: e.target.value })
                }
              />
            </label>
          </details>
          <p className="text-xs text-stone-500">
            Você pode guardar um registro breve e voltar aos detalhes depois.
          </p>
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
        </div>
        <footer className="border-t p-4 flex justify-between items-center gap-2">
          <button className={button} onClick={onClose}>
            Cancelar
          </button>
          <button
            disabled={saving}
            className="bg-teal-800 text-white rounded-lg px-5 py-2 disabled:opacity-50"
            onClick={save}
          >
            {saving ? 'Salvando…' : 'Salvar Agora'}
          </button>
        </footer>
      </section>
    </div>
  );
};
