import React from 'react';
import { AfetivoEntry, MoodScore } from '../../types/mood';
import { VALENCE_LABELS, moodLabel } from '../../services/observations';
import { EntryChange, quickChoiceButtonClass } from './shared';

interface SelectorProps {
  entry: AfetivoEntry;
  onChange: EntryChange;
}

export const ValenceSelector: React.FC<SelectorProps> = ({
  entry,
  onChange,
}) => (
  <fieldset className="space-y-2">
    <legend className="font-semibold">1. Como você se sente?</legend>
    <p id="valence-help" className="text-xs text-stone-500">
      De desagradável a agradável.
    </p>
    {entry.moodScale !== 'valence' && (
      <p className="text-sm text-amber-700">
        Escala antiga preservada: {moodLabel(entry)}. Escolher uma resposta
        abaixo troca a escala deste registro.
      </p>
    )}
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      aria-describedby="valence-help"
    >
      {([-3, -2, -1, 0, 1, 2, 3] as MoodScore[]).map((score) => (
        <button
          type="button"
          key={score}
          className={`${quickChoiceButtonClass} ${entry.moodScale === 'valence' && entry.moodScore === score ? 'bg-teal-100 dark:bg-teal-900' : ''}`}
          aria-pressed={
            entry.moodScale === 'valence' && entry.moodScore === score
          }
          onClick={() => onChange({ moodScore: score, moodScale: 'valence' })}
        >
          {VALENCE_LABELS[score]}
        </button>
      ))}
      <button
        type="button"
        className={quickChoiceButtonClass}
        aria-label="Pular humor"
        aria-pressed={entry.moodScore == null}
        onClick={() => onChange({ moodScore: null, moodScale: 'valence' })}
      >
        Pular
      </button>
    </div>
  </fieldset>
);

export const ActivationSelector: React.FC<SelectorProps> = ({
  entry,
  onChange,
}) => (
  <fieldset className="space-y-2">
    <legend className="font-semibold">2. Quanto você está ativado?</legend>
    <p id="activation-help" className="text-xs text-stone-500">
      Pouco ↔ muito.
    </p>
    <div
      className="grid grid-cols-5 gap-2"
      aria-describedby="activation-help"
    >
      {[1, 2, 3, 4, 5].map((level) => (
        <button
          type="button"
          key={level}
          aria-label={`Ativação ${level}`}
          aria-pressed={entry.activationLevel === level}
          className={`${quickChoiceButtonClass} ${entry.activationLevel === level ? 'bg-teal-100 dark:bg-teal-900' : ''}`}
          onClick={() => onChange({ activationLevel: level })}
        >
          {level}
        </button>
      ))}
    </div>
    <button
      type="button"
      className={quickChoiceButtonClass}
      aria-label="Pular ativação"
      aria-pressed={entry.activationLevel == null}
      onClick={() => onChange({ activationLevel: null })}
    >
      Pular
    </button>
  </fieldset>
);

const QUICK_SCALES = [
  ['anxietyScore', 'Ansiedade'],
  ['urgeScore', 'Impulso / compulsão'],
  ['isolationScore', 'Falta / isolamento'],
] as const;

export const QuickChainScales: React.FC<SelectorProps> = ({
  entry,
  onChange,
}) => (
  <fieldset className="space-y-2">
    <legend className="font-semibold">Se quiser, como está agora?</legend>
    <p className="text-xs text-stone-500">
      Escalas opcionais de 0 a 10. Em branco continua “não informado”.
    </p>
    <div className="grid gap-2 sm:grid-cols-3">
      {QUICK_SCALES.map(([key, label]) => (
        <label key={key} className="text-sm">
          {label}
          <select
            aria-label={`${label} de 0 a 10`}
            className="w-full min-h-11 rounded-lg border border-stone-300 bg-white p-2 dark:border-stone-700 dark:bg-stone-900"
            value={entry[key] ?? ''}
            onChange={(event) =>
              onChange({
                [key]:
                  event.target.value === ''
                    ? null
                    : Number(event.target.value),
              })
            }
          >
            <option value="">Não informado</option>
            {Array.from({ length: 11 }, (_, value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  </fieldset>
);
