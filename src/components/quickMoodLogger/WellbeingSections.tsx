import React from 'react';
import { AfetivoEntry } from '../../types/mood';
import {
  buttonClass,
  EntryChange,
  fieldClass,
  FocusChange,
  ObservedChange,
} from './shared';

interface EntrySectionProps {
  entry: AfetivoEntry;
  onChange: EntryChange;
  onObservedChange: ObservedChange;
}

export const SleepSection: React.FC<EntrySectionProps> = ({
  entry,
  onChange,
  onObservedChange,
}) => (
  <details>
    <summary className="cursor-pointer font-semibold py-2">
      Sono e disposição
    </summary>
    <div className="space-y-3 py-3">
      <p className="text-sm">
        Se souber, informe o sono da última noite. Deixar em branco mantém “não
        informado”.
      </p>
      <label>
        Horas de sono
        <input
          aria-label="Horas de sono"
          type="number"
          min="0"
          max="24"
          step="0.25"
          className={fieldClass}
          value={entry.sleepHours ?? ''}
          onChange={(event) =>
            onObservedChange('sleep', {
              sleepHours:
                event.target.value === '' ? null : Number(event.target.value),
            })
          }
        />
      </label>
      <label>
        Qualidade do sono
        <select
          className={fieldClass}
          value={entry.sleepQuality ?? ''}
          onChange={(event) =>
            onObservedChange('sleep', {
              sleepQuality: (event.target.value ||
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
            className={fieldClass}
            value={entry[key] ?? ''}
            onChange={(event) =>
              onChange({
                [key]:
                  event.target.value === '' ? null : Number(event.target.value),
              })
            }
          />
        </label>
      ))}
    </div>
  </details>
);

interface FocusSectionProps {
  entry: AfetivoEntry;
  onChange: FocusChange;
}

export const FocusSection: React.FC<FocusSectionProps> = ({
  entry,
  onChange,
}) => (
  <details>
    <summary className="cursor-pointer font-semibold py-2">
      Foco e clareza
    </summary>
    <div className="space-y-4 py-3">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Como estava sua clareza mental?
        </legend>
        <p id="mental-clarity-help" className="text-xs text-stone-500">
          1 = muito nebulosa · 5 = muito clara
        </p>
        <div
          className="grid grid-cols-5 gap-2"
          aria-describedby="mental-clarity-help"
        >
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              type="button"
              key={level}
              className={`${buttonClass} min-h-11 min-w-11 ${entry.mentalClarityLevel === level ? 'bg-teal-100 dark:bg-teal-900' : ''}`}
              aria-label={`Clareza mental ${level}`}
              aria-pressed={entry.mentalClarityLevel === level}
              onClick={() => onChange({ mentalClarityLevel: level })}
            >
              {level}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${buttonClass} min-h-11 w-full`}
          aria-pressed={entry.mentalClarityLevel === null}
          onClick={() => onChange({ mentalClarityLevel: null })}
        >
          Não informar clareza mental
        </button>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Você percebeu hiperfoco?
        </legend>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className={`${buttonClass} min-h-11 ${entry.hyperfocusPresent === true ? 'bg-teal-100 dark:bg-teal-900' : ''}`}
            aria-pressed={entry.hyperfocusPresent === true}
            onClick={() => onChange({ hyperfocusPresent: true })}
          >
            Sim
          </button>
          <button
            type="button"
            className={`${buttonClass} min-h-11 ${entry.hyperfocusPresent === false ? 'bg-teal-100 dark:bg-teal-900' : ''}`}
            aria-pressed={entry.hyperfocusPresent === false}
            onClick={() =>
              onChange({ hyperfocusPresent: false, hyperfocusNotes: null })
            }
          >
            Não
          </button>
          <button
            type="button"
            className={`${buttonClass} min-h-11`}
            aria-pressed={entry.hyperfocusPresent === null}
            onClick={() =>
              onChange({ hyperfocusPresent: null, hyperfocusNotes: null })
            }
          >
            Não informar
          </button>
        </div>
      </fieldset>

      {(entry.hyperfocusPresent === true ||
        entry.hyperfocusNotes !== null) && (
        <label className="block text-sm">
          Em quê? (opcional)
          <input
            aria-label="Descrição do hiperfoco"
            className={fieldClass}
            maxLength={120}
            value={entry.hyperfocusNotes ?? ''}
            onChange={(event) =>
              onChange({ hyperfocusNotes: event.target.value || null })
            }
          />
        </label>
      )}

      <label className="block text-sm">
        O que eu precisava e não consegui fazer hoje? (opcional)
        <textarea
          aria-label="O que eu precisava e não consegui fazer hoje"
          className={fieldClass}
          maxLength={300}
          rows={3}
          value={entry.unmetIntentionNotes ?? ''}
          onChange={(event) =>
            onChange({ unmetIntentionNotes: event.target.value || null })
          }
        />
        <span className="mt-1 block text-xs text-stone-500">
          Só se for útil registrar. Deixar em branco mantém “não informado”.
        </span>
      </label>
    </div>
  </details>
);
