import React from 'react';
import {
  AfetivoEntry,
  ImpulsiveBehavior,
  Medication,
  PhysicalActivity,
} from '../../types/mood';
import {
  EntryChange,
  fieldClass,
  FocusChange,
  ObservedChange,
} from './shared';
import {
  FocusSection,
  SleepSection,
} from './WellbeingSections';
import {
  ActivitySection,
  ImpulseSection,
  MedicationSection,
} from './BehaviorSections';
import {
  ChainImpulseSection,
  FunctionalAnalysisSection,
  InternalStateSection,
  ProtectionRecoverySection,
  TriggerDomainSection,
} from './ChainSections';

interface OptionalEntryDetailsProps {
  entry: AfetivoEntry;
  medications: Medication[];
  emotionText: string;
  supportText: string;
  onEmotionTextChange: (value: string) => void;
  onSupportTextChange: (value: string) => void;
  onChange: EntryChange;
  onObservedChange: ObservedChange;
  onFocusChange: FocusChange;
  onImpulseChange: (id: string, patch: Partial<ImpulsiveBehavior>) => void;
  onWorkoutChange: (index: number, patch: Partial<PhysicalActivity>) => void;
}

export const OptionalEntryDetails: React.FC<OptionalEntryDetailsProps> = ({
  entry,
  medications,
  emotionText,
  supportText,
  onEmotionTextChange,
  onSupportTextChange,
  onChange,
  onObservedChange,
  onFocusChange,
  onImpulseChange,
  onWorkoutChange,
}) => (
  <div id="optional-entry-details" className="space-y-3">
    <p className="text-sm text-stone-600 dark:text-stone-400">
      Tudo aqui é opcional.
    </p>
    <label className="block">
      Tipo de registro
      <select
        aria-label="Tipo de registro"
        className={fieldClass}
        value={entry.recordKind ?? 'legacy'}
        onChange={(event) =>
          onChange({
            recordKind: event.target.value as AfetivoEntry['recordKind'],
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
    <TriggerDomainSection
      entry={entry}
      onChange={onChange}
      onObservedChange={onObservedChange}
    />
    <InternalStateSection
      entry={entry}
      emotionText={emotionText}
      onEmotionTextChange={onEmotionTextChange}
      onChange={onChange}
      onObservedChange={onObservedChange}
    />
    <ChainImpulseSection
      entry={entry}
      onChange={onChange}
      onObservedChange={onObservedChange}
    />
    <FunctionalAnalysisSection
      entry={entry}
      onChange={onChange}
      onObservedChange={onObservedChange}
    />
    <ProtectionRecoverySection
      entry={entry}
      supportText={supportText}
      onSupportTextChange={onSupportTextChange}
      onChange={onChange}
      onObservedChange={onObservedChange}
    />
    <p className="pt-2 text-sm font-medium text-stone-600 dark:text-stone-400">
      Outros detalhes opcionais
    </p>
    <SleepSection
      entry={entry}
      onChange={onChange}
      onObservedChange={onObservedChange}
    />
    <FocusSection entry={entry} onChange={onFocusChange} />
    <ImpulseSection
      entry={entry}
      onChange={onChange}
      onObservedChange={onObservedChange}
      onImpulseChange={onImpulseChange}
    />
    <ActivitySection
      entry={entry}
      onChange={onChange}
      onObservedChange={onObservedChange}
      onWorkoutChange={onWorkoutChange}
    />
    <MedicationSection
      entry={entry}
      medications={medications}
      onObservedChange={onObservedChange}
    />
  </div>
);
