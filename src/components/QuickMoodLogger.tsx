import React, { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useModalFocus } from '../hooks/useModalFocus';
import {
  AfetivoEntry,
  ImpulsiveBehavior,
  Medication,
  PhysicalActivity,
} from '../types/mood';
import { moodLabel } from '../services/observations';
import { localDate, isValidDate } from '../services/dates';
import {
  clearEntryDraft,
  loadEntryDraft,
  saveEntryDraft,
} from '../services/entryDraft';
import { useConfirmation } from './ConfirmationProvider';
import {
  ActivationSelector,
  QuickChainScales,
  ValenceSelector,
} from './quickMoodLogger/QuickSelectors';
import { OptionalEntryDetails } from './quickMoodLogger/OptionalEntryDetails';
import {
  buttonClass,
  fieldClass,
  ObservedSection,
} from './quickMoodLogger/shared';

interface Props {
  medications: Medication[];
  initialEntry?: AfetivoEntry | null;
  onSave: (entry: AfetivoEntry) => Promise<boolean> | boolean;
  onClose: () => void;
}

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
  mentalClarityLevel: null,
  hyperfocusPresent: null,
  hyperfocusNotes: null,
  unmetIntentionNotes: null,
  domainFlags: null,
  domainOther: null,
  anxietyScore: null,
  stressScore: null,
  sadnessScore: null,
  urgeScore: null,
  isolationScore: null,
  compulsionLevel: null,
  urgeDescription: null,
  behaviorDescription: null,
  behaviorFunctions: null,
  behaviorFunctionNote: null,
  consequence: null,
  impulsiveSpending: null,
  timeToBaseline: null,
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
  const confirm = useConfirmation();
  const modalRef = useModalFocus(onClose);
  const restoredDraft = useRef(
    initialEntry ? null : loadEntryDraft(),
  ).current;
  const [entry, setEntry] = useState<AfetivoEntry>(() =>
    initialEntry ? { ...initialEntry } : restoredDraft?.entry ?? blankEntry(),
  );
  const [emotionText, setEmotionText] = useState(entry.emotions.join(', '));
  const [supportText, setSupportText] = useState(
    entry.protectiveFactors?.join(', ') ?? '',
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDetails, setShowDetails] = useState(
    Boolean(initialEntry) || Boolean(restoredDraft?.showDetails),
  );
  const [draftRecovered, setDraftRecovered] = useState(
    Boolean(restoredDraft),
  );
  const [hasDraft, setHasDraft] = useState(Boolean(restoredDraft));
  const [draftMessage, setDraftMessage] = useState('');
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftDirty = useRef(false);
  const finalSaved = useRef(false);
  const latestDraft = useRef({ entry, showDetails });
  latestDraft.current = { entry, showDetails };

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (draftTimer.current) clearTimeout(draftTimer.current);
      if (!initialEntry && draftDirty.current && !finalSaved.current) {
        saveEntryDraft(
          latestDraft.current.entry,
          latestDraft.current.showDetails,
        );
      }
    },
    [initialEntry],
  );

  useEffect(() => {
    if (initialEntry || saved || !draftDirty.current) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      const stored = saveEntryDraft(entry, showDetails);
      if (stored) setHasDraft(true);
      setDraftMessage(
        stored
          ? 'Rascunho salvo neste dispositivo.'
          : 'Não foi possível salvar o rascunho neste dispositivo.',
      );
    }, 450);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [entry, initialEntry, saved, showDetails]);

  const markDraftChanged = () => {
    if (initialEntry) return;
    draftDirty.current = true;
    setDraftRecovered(false);
    setDraftMessage('');
  };

  const change = (patch: Partial<AfetivoEntry>) => {
    markDraftChanged();
    setEntry((current) => ({ ...current, ...patch }));
  };

  const observed = (
    section: ObservedSection,
    patch: Partial<AfetivoEntry>,
  ) => {
    markDraftChanged();
    setEntry((current) => ({
      ...current,
      ...patch,
      observedSections: [
        ...new Set([...(current.observedSections ?? []), section]),
      ],
    }));
  };

  const save = async () => {
    if (saving || saved) return;
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
      const didSave = await onSave({ ...entry, moodLabel: moodLabel(entry) });
      if (didSave === false) throw new Error('Não foi possível salvar.');
      if (!initialEntry) {
        finalSaved.current = true;
        draftDirty.current = false;
        if (draftTimer.current) clearTimeout(draftTimer.current);
        clearEntryDraft();
        setHasDraft(false);
        setDraftMessage('');
      }
      setSaving(false);
      setSaved(true);
      closeTimer.current = setTimeout(onClose, 650);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível salvar.',
      );
      setSaving(false);
    }
  };

  const discardDraft = async () => {
    if (
      !(await confirm(
        'Descartar este rascunho? O que ainda não foi salvo como registro será removido.',
      ))
    )
      return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftDirty.current = false;
    clearEntryDraft();
    const freshEntry = blankEntry();
    setEntry(freshEntry);
    setEmotionText('');
    setSupportText('');
    setShowDetails(false);
    setDraftRecovered(false);
    setHasDraft(false);
    setDraftMessage(
      'Rascunho descartado. Você pode começar de novo quando quiser.',
    );
  };

  const changeImpulse = (id: string, patch: Partial<ImpulsiveBehavior>) =>
    observed('impulses', {
      impulsiveBehaviors: entry.impulsiveBehaviors.map((impulse) =>
        impulse.id === id ? { ...impulse, ...patch } : impulse,
      ),
    });

  const changeWorkout = (index: number, patch: Partial<PhysicalActivity>) =>
    observed('activities', {
      physicalActivities: (entry.physicalActivities ?? []).map(
        (activity, activityIndex) =>
          activityIndex === index ? { ...activity, ...patch } : activity,
      ),
    });

  const changeFocus = (
    patch: Pick<
      Partial<AfetivoEntry>,
      | 'mentalClarityLevel'
      | 'hyperfocusPresent'
      | 'hyperfocusNotes'
      | 'unmetIntentionNotes'
    >,
  ) => {
    markDraftChanged();
    setEntry((current) => {
      const next = { ...current, ...patch };
      const hasFocusAnswer =
        next.mentalClarityLevel !== null ||
        next.hyperfocusPresent !== null ||
        next.hyperfocusNotes !== null ||
        next.unmetIntentionNotes !== null;
      return {
        ...next,
        observedSections: hasFocusAnswer
          ? [...new Set([...(current.observedSections ?? []), 'focus' as const])]
          : current.observedSections?.filter((section) => section !== 'focus'),
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-3">
      <section
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logger-title"
        aria-describedby="logger-description"
        aria-busy={saving}
        className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[92vh] flex flex-col overflow-hidden"
      >
        <p id="logger-description" className="sr-only">
          Registro de humor. Humor, ativação, data e horário são suficientes;
          todos os campos podem ficar sem resposta.
        </p>
        <p
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {saved ? 'Registro salvo.' : ''}
        </p>
        <header className="flex justify-between items-center border-b px-3 py-2 sm:p-4">
          <h2 id="logger-title" className="font-semibold text-lg">
            {initialEntry ? 'Editar registro' : 'Como está este momento?'}
          </h2>
          <button
            type="button"
            aria-label="Fechar registro"
            onClick={onClose}
            className={`${buttonClass} min-h-11 min-w-11 flex items-center justify-center`}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-5">
          {draftRecovered && (
            <p
              role="status"
              className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-200"
            >
              Rascunho recuperado neste dispositivo. Continue de onde parou ou
              salve como está.
            </p>
          )}
          {entry.isDemo && (
            <p className="text-sm text-amber-700">
              Este é um exemplo fictício. A edição continua marcada como
              demonstração.
            </p>
          )}
          <ValenceSelector entry={entry} onChange={change} />
          <ActivationSelector entry={entry} onChange={change} />
          <QuickChainScales entry={entry} onChange={change} />
          <div className="grid grid-cols-2 gap-3">
            <label className="min-w-0 text-sm">
              Data
              <input
                aria-label="Data"
                className={fieldClass}
                type="date"
                value={entry.date}
                onChange={(event) => change({ date: event.target.value })}
              />
            </label>
            <label className="min-w-0 text-sm">
              Horário
              <input
                aria-label="Horário"
                className={fieldClass}
                type="time"
                value={entry.time}
                onChange={(event) => change({ time: event.target.value })}
              />
            </label>
          </div>
          {!showDetails && (
            <button
              type="button"
              className="w-full min-h-11 touch-manipulation rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-teal-800 dark:border-stone-700 dark:text-teal-300"
              aria-expanded="false"
              aria-controls="optional-entry-details"
              onClick={() => {
                markDraftChanged();
                setShowDetails(true);
              }}
            >
              Adicionar detalhes da cadeia
            </button>
          )}
          {showDetails && (
            <OptionalEntryDetails
              entry={entry}
              medications={medications}
              emotionText={emotionText}
              supportText={supportText}
              onEmotionTextChange={setEmotionText}
              onSupportTextChange={setSupportText}
              onChange={change}
              onObservedChange={observed}
              onFocusChange={changeFocus}
              onImpulseChange={changeImpulse}
              onWorkoutChange={changeWorkout}
            />
          )}
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
        </div>
        <footer className="shrink-0 border-t p-3 sm:p-4 flex flex-wrap justify-between items-center gap-2 sm:gap-3">
          <div className="min-h-5 text-xs sm:text-sm">
            {saved && (
              <p className="flex items-center gap-2 text-sm text-teal-800 dark:text-teal-300">
                <Check size={17} aria-hidden="true" />
                Salvo neste dispositivo.
              </p>
            )}
            {!saved && draftMessage && (
              <p
                role="status"
                className="text-stone-600 dark:text-stone-400"
              >
                {draftMessage}
              </p>
            )}
            {!saved && !draftMessage && (
              <p className="flex items-center gap-1.5 font-medium text-teal-800 dark:text-teal-300">
                <Check size={16} aria-hidden="true" />
                Pronto para salvar
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2 ml-auto">
            {hasDraft && !initialEntry && !saved && (
              <button
                type="button"
                className="min-h-11 rounded-lg px-2 py-2 text-xs text-rose-700 dark:text-rose-300 sm:px-3 sm:text-sm"
                onClick={discardDraft}
              >
                Descartar rascunho
              </button>
            )}
            <button
              type="button"
              className={`${buttonClass} min-h-11`}
              onClick={onClose}
              disabled={saving || saved}
            >
              Fechar
            </button>
            <button
              type="button"
              disabled={saving || saved}
              className="bg-teal-800 text-white rounded-lg min-h-11 px-5 sm:px-6 py-2 font-semibold shadow-sm disabled:opacity-60"
              onClick={save}
            >
              {saving ? 'Salvando…' : saved ? 'Salvo' : 'Salvar'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
