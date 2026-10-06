import React, { useState } from 'react';
import { AfetivoEntry } from '../../types/mood';
import {
  CONTEXT_OPTIONS,
  EFFECT_LABELS,
} from '../../services/observations';
import {
  buttonClass,
  EntryChange,
  fieldClass,
  ObservedChange,
} from './shared';

const DOMAIN_OPTIONS = [
  ['relacionamentos', 'Relacionamentos'],
  ['financeiro', 'Dinheiro / financeiro'],
  ['solidao', 'Solidão / pertencimento'],
  ['trabalho', 'Trabalho / demandas'],
  ['familia', 'Família / ambiente'],
  ['outro', 'Outro'],
] as const;

const EMOTION_OPTIONS = [
  'Alegria',
  'Tranquilidade',
  'Entusiasmo',
  'Frustração',
  'Tristeza',
  'Ansiedade',
  'Irritação',
  'Cansaço',
];

const FUNCTION_OPTIONS = [
  'Aliviar tensão / ansiedade',
  'Preencher vazio',
  'Sentir-se desejado / validado',
  'Escapar da realidade',
  'Regular ativação (acalmar ou estimular)',
  'Buscar pertencimento / contato',
  'Prazer imediato',
  'Automatismo / hábito',
  'Proteger-se de conflito',
  'Sentir algum controle',
  'Reduzir sobrecarga emocional',
  'Evitar o silêncio / tédio',
  'Outro',
];

const scoreOptions = Array.from({ length: 11 }, (_, value) => value);

interface ChainSectionProps {
  entry: AfetivoEntry;
  onChange: EntryChange;
  onObservedChange: ObservedChange;
}

interface TriggerDomainSectionProps extends ChainSectionProps {}

export const TriggerDomainSection: React.FC<TriggerDomainSectionProps> = ({
  entry,
  onObservedChange,
}) => {
  const flags = entry.domainFlags ?? [];
  const toggleDomain = (value: string) => {
    const next = flags.includes(value)
      ? flags.filter((flag) => flag !== value)
      : [...flags, value];
    onObservedChange('context', {
      domainFlags: next.length ? next : null,
      ...(value === 'outro' && flags.includes(value)
        ? { domainOther: null }
        : {}),
    });
  };
  const toggleContext = (value: string) =>
    onObservedChange('context', {
      contexts: (entry.contexts ?? []).includes(value)
        ? (entry.contexts ?? []).filter((context) => context !== value)
        : [...(entry.contexts ?? []), value],
    });

  return (
    <details>
      <summary className="cursor-pointer py-2 font-semibold">
        A. Gatilho e domínio
      </summary>
      <div className="space-y-4 py-3">
        <label className="block text-sm">
          Gatilho / contexto (opcional)
          <textarea
            className={fieldClass}
            rows={2}
            value={entry.triggers.join(' · ')}
            onChange={(event) =>
              onObservedChange('context', {
                triggers: event.target.value ? [event.target.value] : [],
              })
            }
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Que área estava mais presente?
          </legend>
          <div className="flex flex-wrap gap-2">
            {DOMAIN_OPTIONS.map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={`${buttonClass} min-h-11`}
                aria-pressed={flags.includes(value)}
                onClick={() => toggleDomain(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        {flags.includes('outro') && (
          <label className="block text-sm">
            Outro domínio (opcional)
            <input
              className={fieldClass}
              value={entry.domainOther ?? ''}
              onChange={(event) =>
                onObservedChange('context', {
                  domainOther: event.target.value || null,
                })
              }
            />
          </label>
        )}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Contexto adicional (opcional)
          </legend>
          <div className="flex flex-wrap gap-2">
            {CONTEXT_OPTIONS.map((value) => (
              <button
                type="button"
                key={value}
                className={buttonClass}
                aria-pressed={entry.contexts?.includes(value) ?? false}
                onClick={() => toggleContext(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </details>
  );
};

interface InternalStateSectionProps extends ChainSectionProps {
  emotionText: string;
  onEmotionTextChange: (value: string) => void;
}

export const InternalStateSection: React.FC<InternalStateSectionProps> = ({
  entry,
  emotionText,
  onEmotionTextChange,
  onObservedChange,
}) => {
  const toggleEmotion = (value: string) => {
    const emotions = entry.emotions.includes(value)
      ? entry.emotions.filter((emotion) => emotion !== value)
      : [...entry.emotions, value];
    onObservedChange('context', { emotions });
    onEmotionTextChange(emotions.join(', '));
  };

  return (
    <details>
      <summary className="cursor-pointer py-2 font-semibold">
        B. Estado interno
      </summary>
      <div className="space-y-4 py-3">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Emoções percebidas</legend>
          <div className="flex flex-wrap gap-2">
            {EMOTION_OPTIONS.map((value) => (
              <button
                type="button"
                key={value}
                className={buttonClass}
                aria-pressed={entry.emotions.includes(value)}
                onClick={() => toggleEmotion(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm">
          Emoções em suas palavras (separadas por vírgula)
          <input
            className={fieldClass}
            value={emotionText}
            onChange={(event) => {
              const value = event.target.value;
              onEmotionTextChange(value);
              onObservedChange('context', {
                emotions: value
                  .split(',')
                  .map((emotion) => emotion.trim())
                  .filter(Boolean),
              });
            }}
          />
        </label>
        <label className="block text-sm">
          Corpo / sinais físicos (opcional)
          <input
            className={fieldClass}
            value={entry.somaticSymptoms.join(' · ')}
            onChange={(event) =>
              onObservedChange('context', {
                somaticSymptoms: event.target.value
                  ? [event.target.value]
                  : [],
              })
            }
          />
        </label>
        <p className="text-xs text-stone-500">
          A ativação de 1 a 5 fica no registro rápido acima.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ['stressScore', 'Estresse / nervosismo'],
              ['sadnessScore', 'Tristeza / angústia'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm">
              {label} (0–10)
              <select
                className={fieldClass}
                value={entry[key] ?? ''}
                onChange={(event) =>
                  onObservedChange('context', {
                    [key]:
                      event.target.value === ''
                        ? null
                        : Number(event.target.value),
                  })
                }
              >
                <option value="">Não informado</option>
                {scoreOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
    </details>
  );
};

export const ChainImpulseSection: React.FC<ChainSectionProps> = ({
  entry,
  onChange,
  onObservedChange,
}) => {
  const [showSpending, setShowSpending] = useState(
    entry.impulsiveSpending != null,
  );
  const levels = [
    ['none', 'Não'],
    ['risk', 'Risco / impulso'],
    ['mild', 'Leve'],
    ['yes', 'Sim'],
  ] as const;

  return (
    <details>
      <summary className="cursor-pointer py-2 font-semibold">
        C. Impulso e comportamento
      </summary>
      <div className="space-y-4 py-3">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Como você classificaria a compulsão neste momento?
          </legend>
          <p className="text-xs text-stone-500">
            É apenas uma descrição do momento, sem julgamento.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {levels.map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={`${buttonClass} min-h-11`}
                aria-pressed={entry.compulsionLevel === value}
                onClick={() =>
                  onObservedChange('impulses', { compulsionLevel: value })
                }
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`${buttonClass} min-h-11 w-full`}
            aria-pressed={entry.compulsionLevel == null}
            onClick={() =>
              onChange({
                compulsionLevel: null,
                observedSections:
                  entry.urgeDescription ||
                  entry.behaviorDescription ||
                  entry.behaviorFunctions?.length ||
                  entry.behaviorFunctionNote ||
                  entry.consequence ||
                  entry.impulsiveSpending != null ||
                  entry.impulsiveBehaviors.length
                    ? entry.observedSections
                    : entry.observedSections?.filter(
                        (section) => section !== 'impulses',
                      ),
              })
            }
          >
            Não informar
          </button>
        </fieldset>
        <label className="block text-sm">
          Descrição do impulso (opcional)
          <textarea
            className={fieldClass}
            rows={2}
            value={entry.urgeDescription ?? ''}
            onChange={(event) =>
              onObservedChange('impulses', {
                urgeDescription: event.target.value || null,
              })
            }
          />
        </label>
        <label className="block text-sm">
          Comportamento / resposta — o que você fez? (opcional)
          <textarea
            className={fieldClass}
            rows={2}
            value={entry.behaviorDescription ?? ''}
            onChange={(event) =>
              onObservedChange('impulses', {
                behaviorDescription: event.target.value || null,
              })
            }
          />
        </label>
        {!showSpending ? (
          <button
            type="button"
            className={`${buttonClass} min-h-11 w-full`}
            onClick={() => setShowSpending(true)}
          >
            Registrar gasto impulsivo, se fizer sentido
          </button>
        ) : (
          <label className="block text-sm">
            Gasto impulsivo (R$)
            <input
              aria-label="Gasto impulsivo em reais"
              className={fieldClass}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={entry.impulsiveSpending ?? ''}
              onChange={(event) =>
                onObservedChange('impulses', {
                  impulsiveSpending:
                    event.target.value === ''
                      ? null
                      : Number(event.target.value),
                })
              }
            />
          </label>
        )}
      </div>
    </details>
  );
};

export const FunctionalAnalysisSection: React.FC<ChainSectionProps> = ({
  entry,
  onObservedChange,
}) => {
  const selectedFunctions = entry.behaviorFunctions ?? [];
  const toggleFunction = (value: string) => {
    const next = selectedFunctions.includes(value)
      ? selectedFunctions.filter((item) => item !== value)
      : [...selectedFunctions, value];
    onObservedChange('impulses', {
      behaviorFunctions: next.length ? next : null,
    });
  };

  return (
    <details>
      <summary className="cursor-pointer py-2 font-semibold">
        D. Função e consequência
      </summary>
      <div className="space-y-4 py-3">
        <p id="behavior-function-help" className="text-sm">
          Para que esse comportamento pareceu servir naquele momento? Você pode
          marcar mais de uma opção. Isso não é justificativa nem culpa.
        </p>
        <fieldset
          className="space-y-2"
          aria-describedby="behavior-function-help"
        >
          <legend className="text-sm font-medium">
            Função do comportamento (opcional)
          </legend>
          <div className="flex flex-wrap gap-2">
            {FUNCTION_OPTIONS.map((value) => (
              <button
                type="button"
                key={value}
                className={`${buttonClass} min-h-11`}
                aria-pressed={selectedFunctions.includes(value)}
                onClick={() => toggleFunction(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm">
          {selectedFunctions.includes('Outro')
            ? 'Qual outra função? (opcional)'
            : 'Complemento em suas palavras (opcional)'}
          <input
            aria-label="Complemento da função do comportamento"
            className={fieldClass}
            value={entry.behaviorFunctionNote ?? ''}
            onChange={(event) =>
              onObservedChange('impulses', {
                behaviorFunctionNote: event.target.value || null,
              })
            }
          />
        </label>
        <label className="block text-sm">
          Consequência percebida depois (opcional)
          <textarea
            aria-describedby="consequence-help"
            className={fieldClass}
            rows={2}
            value={entry.consequence ?? ''}
            onChange={(event) =>
              onObservedChange('impulses', {
                consequence: event.target.value || null,
              })
            }
          />
          <span id="consequence-help" className="text-xs text-stone-500">
            O que mudou logo depois, sem precisar avaliar como bom ou ruim.
          </span>
        </label>
      </div>
    </details>
  );
};

interface ProtectionRecoverySectionProps extends ChainSectionProps {
  supportText: string;
  onSupportTextChange: (value: string) => void;
}

export const ProtectionRecoverySection: React.FC<
  ProtectionRecoverySectionProps
> = ({
  entry,
  supportText,
  onSupportTextChange,
  onObservedChange,
}) => (
  <details>
    <summary className="cursor-pointer py-2 font-semibold">
      E. Proteção e recuperação
    </summary>
    <div className="space-y-4 py-3">
      <label className="block text-sm">
        O que ajudou / proteções (opcional)
        <textarea
          className={fieldClass}
          rows={2}
          value={entry.whatHelpedNotes ?? ''}
          onChange={(event) =>
            onObservedChange('support', {
              whatHelpedNotes: event.target.value,
            })
          }
        />
      </label>
      <label className="block text-sm">
        Apoios em palavras curtas (separados por vírgula)
        <input
          className={fieldClass}
          value={supportText}
          onChange={(event) => {
            const value = event.target.value;
            onSupportTextChange(value);
            onObservedChange('support', {
              protectiveFactors: value
                .split(',')
                .map((support) => support.trim())
                .filter(Boolean),
            });
          }}
        />
      </label>
      <label className="block text-sm">
        Como foi para você?
        <select
          aria-label="Avaliação do apoio"
          className={fieldClass}
          value={entry.strategyEffect ?? ''}
          onChange={(event) =>
            onObservedChange('support', {
              strategyEffect: (event.target.value ||
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
      <label className="block text-sm">
        Tempo aproximado para voltar ao eixo (opcional)
        <input
          className={fieldClass}
          placeholder="Ex.: 20 minutos, algumas horas"
          value={entry.timeToBaseline ?? ''}
          onChange={(event) =>
            onObservedChange('support', {
              timeToBaseline: event.target.value || null,
            })
          }
        />
      </label>
      <label className="block text-sm">
        Um próximo passo escolhido por você (opcional)
        <input
          className={fieldClass}
          value={entry.nextStep ?? ''}
          onChange={(event) =>
            onObservedChange('support', { nextStep: event.target.value })
          }
        />
      </label>
      <label className="block text-sm">
        Notas livres (opcional)
        <textarea
          aria-label="Notas livres"
          className={fieldClass}
          rows={3}
          value={entry.journalNotes}
          onChange={(event) =>
            onObservedChange('notes', { journalNotes: event.target.value })
          }
        />
      </label>
    </div>
  </details>
);
