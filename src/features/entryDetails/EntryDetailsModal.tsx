import { useId, useState } from 'react';
import {
  entrySchema,
  type Entry,
  type Impulse,
  type Metrics,
  type OpenedSection,
  type PhysicalActivity,
} from '@/core/entry';
import { COMPULSION_LABELS, EFFECT_LABELS, SLEEP_QUALITY_LABELS } from '@/core/labels';
import { Button, ChoiceButton, Field, Modal, inputClass } from '@/components/ui';
import { useSaveEntry } from '@/data/hooks';
import { ActivityEditor, ImpulseEditor, TagEditor } from './DetailsLists';

const SECTIONS: readonly { key: OpenedSection; title: string; description: string }[] = [
  {
    key: 'context',
    title: 'Estado, contexto & tags',
    description: 'Estado misto, compulsão, sintomas e tags.',
  },
  {
    key: 'sleep',
    title: 'Sono & energia',
    description: 'Quanto dormiu, qualidade e disposição.',
  },
  {
    key: 'impulses',
    title: 'Impulsos, compulsões & cadeia',
    description: 'O que senti, fiz e o que aconteceu depois.',
  },
  {
    key: 'activities',
    title: 'Atividade física',
    description: 'Movimento do dia e como me deixou.',
  },
  {
    key: 'focus',
    title: 'Foco',
    description: 'Hiperfoco e intenções não cumpridas.',
  },
  {
    key: 'notes',
    title: 'Diário & gratidão',
    description: 'Texto livre e o que funcionou hoje.',
  },
];

interface NumberFieldProps {
  label: string;
  hint?: string;
  value: number | null;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number | null) => void;
}

/**
 * Campo numérico com texto bruto local: evita que o controle numérico
 * apague decimais enquanto o usuário digita (ex.: “7.5”).
 */
function NumberField({ label, hint, value, min, max, step, onChange }: NumberFieldProps) {
  const [raw, setRaw] = useState(value === null ? '' : String(value));
  return (
    <Field label={label} hint={hint}>
      {(control) => (
        <input
          {...control}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          className={inputClass}
          value={raw}
          onChange={(event) => {
            const text = event.target.value;
            setRaw(text);
            onChange(text === '' ? null : Number(text));
          }}
        />
      )}
    </Field>
  );
}

interface SelectFieldProps {
  label: string;
  hint?: string;
  value: string | null;
  options: readonly { value: string; label: string }[];
  onChange: (value: string | null) => void;
}

function SelectField({ label, hint, value, options, onChange }: SelectFieldProps) {
  return (
    <Field label={label} hint={hint}>
      {(control) => (
        <select
          {...control}
          className={inputClass}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
        >
          <option value="">Não informado</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

function TriState({
  legend,
  value,
  onChange,
}: {
  legend: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        <ChoiceButton selected={value === true} onClick={() => onChange(true)}>
          Sim
        </ChoiceButton>
        <ChoiceButton selected={value === false} onClick={() => onChange(false)}>
          Não
        </ChoiceButton>
        <ChoiceButton selected={value === null} onClick={() => onChange(null)}>
          Em branco
        </ChoiceButton>
      </div>
    </fieldset>
  );
}

export interface EntryDetailsModalProps {
  entry: Entry;
  onClose: () => void;
}

/**
 * Formulário completo do registro: seções opcionais que só abrem quando
 * interessam (e ficam marcadas em `openedSections`, como no v1). Nada aqui
 * é obrigatório — campos vazios continuam em `null`.
 */
export function EntryDetailsModal({ entry, onClose }: EntryDetailsModalProps) {
  const save = useSaveEntry();
  const baseId = useId();
  const [draft, setDraft] = useState<Entry>(entry);
  const [opened, setOpened] = useState<Set<OpenedSection>>(() => new Set(entry.openedSections));
  const [error, setError] = useState<string | null>(null);

  const patch = (updates: Partial<Entry>): void =>
    setDraft((current) => ({ ...current, ...updates }));
  const patchMetrics = (updates: Partial<Metrics>): void =>
    setDraft((current) => ({ ...current, metrics: { ...current.metrics, ...updates } }));
  const patchChain = (updates: Partial<Entry['chain']>): void =>
    setDraft((current) => ({ ...current, chain: { ...current.chain, ...updates } }));
  const patchFocus = (updates: Partial<Entry['focus']>): void =>
    setDraft((current) => ({ ...current, focus: { ...current.focus, ...updates } }));

  function toggleSection(key: OpenedSection): void {
    setOpened((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleSave(): Promise<void> {
    setError(null);
    try {
      const parsed = entrySchema.parse({
        ...draft,
        openedSections: [...opened],
        impulses: draft.impulses.filter((impulse) => impulse.type.trim() !== ''),
        physicalActivities: draft.physicalActivities.filter(
          (activity) => activity.type.trim() !== '',
        ),
        updatedAt: Date.now(),
      });
      await save.mutateAsync(parsed);
      onClose();
    } catch {
      setError('Não foi possível salvar. Confira os campos e tente novamente.');
    }
  }

  function renderSectionContent(key: OpenedSection) {
    switch (key) {
      case 'context':
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Estresse (0–10)"
                value={draft.metrics.stress}
                min={0}
                max={10}
                step={1}
                onChange={(value) => patchMetrics({ stress: value })}
              />
              <NumberField
                label="Tristeza (0–10)"
                value={draft.metrics.sadness}
                min={0}
                max={10}
                step={1}
                onChange={(value) => patchMetrics({ sadness: value })}
              />
              <NumberField
                label="Irritabilidade (0–10)"
                value={draft.metrics.irritability}
                min={0}
                max={10}
                step={1}
                onChange={(value) => patchMetrics({ irritability: value })}
              />
              <NumberField
                label="Ansiedade (0–10)"
                value={draft.metrics.anxiety}
                min={0}
                max={10}
                step={1}
                onChange={(value) => patchMetrics({ anxiety: value })}
              />
              <NumberField
                label="Impulso / compulsão (0–10)"
                value={draft.metrics.urge}
                min={0}
                max={10}
                step={1}
                onChange={(value) => patchMetrics({ urge: value })}
              />
              <NumberField
                label="Falta / isolamento (0–10)"
                value={draft.metrics.isolation}
                min={0}
                max={10}
                step={1}
                onChange={(value) => patchMetrics({ isolation: value })}
              />
              <NumberField
                label="Gasto impulsivo (valor)"
                hint="Valor em reais; deixe em branco se não houve."
                value={draft.metrics.impulsiveSpending}
                min={0}
                max={1_000_000_000}
                onChange={(value) => patchMetrics({ impulsiveSpending: value })}
              />
              <Field label="Tempo até voltar ao normal">
                {(control) => (
                  <input
                    {...control}
                    className={inputClass}
                    value={draft.metrics.timeToBaseline ?? ''}
                    maxLength={300}
                    placeholder="Ex.: uns 20 minutos"
                    onChange={(event) =>
                      patchMetrics({ timeToBaseline: event.target.value || null })
                    }
                  />
                )}
              </Field>
            </div>

            <SelectField
              label="Compulsão"
              value={draft.compulsion}
              options={Object.entries(COMPULSION_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              onChange={(value) => patch({ compulsion: value as Entry['compulsion'] })}
            />

            <TriState
              legend="Agitação com desânimo no mesmo momento (estado misto)"
              value={draft.isMixedState}
              onChange={(value) => patch({ isMixedState: value })}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">Tags</p>
              <TagEditor tags={draft.tags} onChange={(tags) => patch({ tags })} />
            </div>
          </>
        );

      case 'sleep':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Horas de sono"
              value={draft.metrics.sleepHours}
              min={0}
              max={24}
              step={0.5}
              onChange={(value) => patchMetrics({ sleepHours: value })}
            />
            <SelectField
              label="Qualidade do sono"
              value={draft.metrics.sleepQuality}
              options={Object.entries(SLEEP_QUALITY_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              onChange={(value) => patchMetrics({ sleepQuality: value as Metrics['sleepQuality'] })}
            />
            <NumberField
              label="Minutos para dormir"
              value={draft.metrics.sleepLatencyMinutes}
              min={0}
              max={1440}
              step={1}
              onChange={(value) => patchMetrics({ sleepLatencyMinutes: value })}
            />
            <NumberField
              label="Energia (1–5)"
              value={draft.metrics.energy}
              min={1}
              max={5}
              step={1}
              onChange={(value) => patchMetrics({ energy: value })}
            />
            <NumberField
              label="Clareza mental (1–5)"
              value={draft.metrics.mentalClarity}
              min={1}
              max={5}
              step={1}
              onChange={(value) => patchMetrics({ mentalClarity: value })}
            />
          </div>
        );

      case 'impulses':
        return (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">Impulsos e compulsões</p>
              <ImpulseEditor
                impulses={draft.impulses}
                onChange={(impulses) => patch({ impulses: impulses as Impulse[] })}
              />
            </div>

            <div className="space-y-4 border-t border-edge pt-4">
              <p className="text-sm font-medium">Cadeia — antes, durante e depois</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Desejo / vontade">
                  {(control) => (
                    <textarea
                      {...control}
                      className="w-full min-h-20 rounded-xl border border-edge bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted"
                      value={draft.chain.urgeDescription ?? ''}
                      maxLength={2000}
                      placeholder="O que passou pela cabeça?"
                      onChange={(event) =>
                        patchChain({ urgeDescription: event.target.value || null })
                      }
                    />
                  )}
                </Field>
                <Field label="Comportamento">
                  {(control) => (
                    <textarea
                      {...control}
                      className="w-full min-h-20 rounded-xl border border-edge bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted"
                      value={draft.chain.behaviorDescription ?? ''}
                      maxLength={2000}
                      placeholder="O que fiz na prática?"
                      onChange={(event) =>
                        patchChain({ behaviorDescription: event.target.value || null })
                      }
                    />
                  )}
                </Field>
              </div>

              <Field label="Consequência">
                {(control) => (
                  <textarea
                    {...control}
                    className="w-full min-h-20 rounded-xl border border-edge bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted"
                    value={draft.chain.consequence ?? ''}
                    maxLength={2000}
                    placeholder="O que aconteceu em seguida?"
                    onChange={(event) => patchChain({ consequence: event.target.value || null })}
                  />
                )}
              </Field>

              <SelectField
                label="A estratégia ajudou?"
                value={draft.chain.strategyEffect}
                options={Object.entries(EFFECT_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(value) =>
                  patchChain({ strategyEffect: value as Entry['chain']['strategyEffect'] })
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Próximo passo">
                  {(control) => (
                    <input
                      {...control}
                      className={inputClass}
                      value={draft.chain.nextStep ?? ''}
                      maxLength={1000}
                      placeholder="O que quero fazer da próxima vez"
                      onChange={(event) => patchChain({ nextStep: event.target.value || null })}
                    />
                  )}
                </Field>
                <Field label="O que ajudou (notas)">
                  {(control) => (
                    <input
                      {...control}
                      className={inputClass}
                      value={draft.chain.whatHelpedNotes ?? ''}
                      maxLength={2000}
                      placeholder="Pausa, pessoa de apoio, mudança de ambiente…"
                      onChange={(event) =>
                        patchChain({ whatHelpedNotes: event.target.value || null })
                      }
                    />
                  )}
                </Field>
              </div>
            </div>
          </>
        );

      case 'activities':
        return (
          <ActivityEditor
            activities={draft.physicalActivities}
            onChange={(physicalActivities) =>
              patch({ physicalActivities: physicalActivities as PhysicalActivity[] })
            }
          />
        );

      case 'focus':
        return (
          <>
            <TriState
              legend="Hiperfoco presente?"
              value={draft.focus.hyperfocusPresent}
              onChange={(value) => patchFocus({ hyperfocusPresent: value })}
            />
            <Field label="Sobre o hiperfoco">
              {(control) => (
                <textarea
                  {...control}
                  className="w-full min-h-20 rounded-xl border border-edge bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted"
                  value={draft.focus.hyperfocusNotes ?? ''}
                  maxLength={1000}
                  placeholder="Em quê, por quanto tempo, o que ficou de lado"
                  onChange={(event) => patchFocus({ hyperfocusNotes: event.target.value || null })}
                />
              )}
            </Field>
            <Field label="Intenções que não cumpri">
              {(control) => (
                <textarea
                  {...control}
                  className="w-full min-h-20 rounded-xl border border-edge bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted"
                  value={draft.focus.unmetIntentionNotes ?? ''}
                  maxLength={1000}
                  placeholder="O que planejei e não aconteceu"
                  onChange={(event) =>
                    patchFocus({ unmetIntentionNotes: event.target.value || null })
                  }
                />
              )}
            </Field>
          </>
        );

      case 'notes':
        return (
          <>
            <Field label="Diário">
              {(control) => (
                <textarea
                  {...control}
                  className="w-full min-h-28 rounded-xl border border-edge bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted"
                  value={draft.journalNotes}
                  placeholder="Como foi o dia, o que aconteceu, como me senti"
                  onChange={(event) => patch({ journalNotes: event.target.value })}
                />
              )}
            </Field>
            <Field label="Gratidão" hint="O que funcionou hoje — por menor que seja.">
              {(control) => (
                <textarea
                  {...control}
                  className="w-full min-h-20 rounded-xl border border-edge bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted"
                  value={draft.gratitudeNotes ?? ''}
                  maxLength={2000}
                  placeholder="Três coisas boas, uma frase, um agradecimento"
                  onChange={(event) => patch({ gratitudeNotes: event.target.value || null })}
                />
              )}
            </Field>
          </>
        );

      default:
        return null;
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Detalhes do registro"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={save.isPending}>
            Salvar detalhes
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">
        Tudo é opcional — abra só as seções que quiser registrar e deixe o resto em branco.
      </p>

      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const isOpen = opened.has(section.key);
          const panelId = `${baseId}-${section.key}`;
          return (
            <section key={section.key} className="rounded-2xl border border-edge">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleSection(section.key)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left hover:bg-panel-2"
              >
                <span>
                  <span className="block text-sm font-medium">{section.title}</span>
                  <span className="block text-xs text-ink-muted">{section.description}</span>
                </span>
                <span className="shrink-0 text-sm text-brand">{isOpen ? 'Fechar' : 'Abrir'}</span>
              </button>
              {isOpen && (
                <div id={panelId} className="space-y-4 border-t border-edge p-4">
                  {renderSectionContent(section.key)}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
