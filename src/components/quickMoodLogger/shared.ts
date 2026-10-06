import { AfetivoEntry } from '../../types/mood';

export const fieldClass =
  'w-full min-w-0 min-h-11 border border-stone-300 dark:border-stone-700 rounded-lg p-2 bg-white dark:bg-stone-900';

export const buttonClass =
  'border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-2 cursor-pointer aria-pressed:bg-teal-100 dark:aria-pressed:bg-teal-900';

export const quickChoiceButtonClass = `${buttonClass} min-h-12 min-w-11 w-full touch-manipulation px-2 py-2 text-sm font-medium leading-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 aria-pressed:border-teal-700 aria-pressed:ring-2 aria-pressed:ring-teal-600/30`;

export type ObservedSection = NonNullable<
  AfetivoEntry['observedSections']
>[number];

export type EntryChange = (patch: Partial<AfetivoEntry>) => void;

export type ObservedChange = (
  section: ObservedSection,
  patch: Partial<AfetivoEntry>,
) => void;

export type FocusChange = (
  patch: Pick<
    Partial<AfetivoEntry>,
    | 'mentalClarityLevel'
    | 'hyperfocusPresent'
    | 'hyperfocusNotes'
    | 'unmetIntentionNotes'
  >,
) => void;
