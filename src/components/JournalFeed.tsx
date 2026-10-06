import React, { useState } from 'react';
import { AfetivoEntry, MOOD_LEVEL_CONFIG } from '../types/mood';
import { Search, Moon, Zap, Edit3, Trash2, Heart, AlertTriangle, ShieldCheck, Dumbbell, Tag, Pill } from 'lucide-react';

interface Props {
  entries: AfetivoEntry[];
  onEditEntry: (entry: AfetivoEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const JournalFeed: React.FC<Props> = ({
  entries,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomTag, setSelectedCustomTag] = useState<string | null>(null);
  const [filterPolarity, setFilterPolarity] = useState<
    'all' | 'high' | 'balanced' | 'low' | 'mixed' | 'impulses' | 'protections' | 'workouts'
  >('all');

  // Collect unique custom tags across all entries
  const allCustomTags = Array.from(
    new Set(entries.flatMap((e) => e.customTags || []).filter(Boolean))
  );

  const filtered = entries
    .filter((entry) => {
      // Filter by mood range
      if (filterPolarity === 'high' && entry.moodScore <= 0) return false;
      if (filterPolarity === 'balanced' && entry.moodScore !== 0) return false;
      if (filterPolarity === 'low' && entry.moodScore >= 0) return false;
      if (filterPolarity === 'mixed' && !entry.isMixedState) return false;
      if (filterPolarity === 'impulses' && (!entry.impulsiveBehaviors || entry.impulsiveBehaviors.length === 0)) return false;
      if (
        filterPolarity === 'protections' &&
        (!entry.protectiveFactors || entry.protectiveFactors.length === 0) &&
        !entry.whatHelpedNotes
      )
        return false;
      if (
        filterPolarity === 'workouts' &&
        (!entry.physicalActivities || entry.physicalActivities.length === 0)
      )
        return false;

      // Filter by custom tag
      if (selectedCustomTag && (!entry.customTags || !entry.customTags.includes(selectedCustomTag))) {
        return false;
      }

      // Text search
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const inJournal = entry.journalNotes?.toLowerCase().includes(term);
      const inGratitude = entry.gratitudeNotes?.toLowerCase().includes(term);
      const inEmotions = entry.emotions?.some((e) => e.toLowerCase().includes(term));
      const inTriggers = entry.triggers?.some((t) => t.toLowerCase().includes(term));
      const inImpulses = entry.impulsiveBehaviors?.some(
        (i) => i.type.toLowerCase().includes(term) || i.reflection?.toLowerCase().includes(term)
      );
      const inProtections =
        entry.protectiveFactors?.some((p) => p.toLowerCase().includes(term)) ||
        entry.whatHelpedNotes?.toLowerCase().includes(term);
      const inWorkouts = entry.physicalActivities?.some(
        (w) =>
          w.type.toLowerCase().includes(term) ||
          w.postWorkoutFeeling?.toLowerCase().includes(term)
      );
      const inCustomTags = entry.customTags?.some((t) => t.toLowerCase().includes(term));

      return (
        inJournal ||
        inGratitude ||
        inEmotions ||
        inTriggers ||
        inImpulses ||
        inProtections ||
        inWorkouts ||
        inCustomTags
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por sentimentos, exercícios, anotações, impulsos ou gatilhos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="text-xs text-stone-500 flex items-center gap-1.5 self-end sm:self-center font-mono">
            <span>{filtered.length}</span>
            <span>registros encontrados</span>
          </div>
        </div>

        {/* Polarity Filter Segmented Control */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'Todos os Dias' },
            { id: 'high', label: '+ Mais Energia / Disposição' },
            { id: 'balanced', label: '0 Equilibrado / Calmo' },
            { id: 'low', label: '- Menos Energia / Desânimo' },
            { id: 'mixed', label: 'Agitado + Cansado' },
            { id: 'workouts', label: 'Com Atividade Física' },
            { id: 'impulses', label: 'Com Impulsos' },
            { id: 'protections', label: 'Proteções & O Que Ajudou' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterPolarity(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors border cursor-pointer ${
                filterPolarity === tab.id
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 font-medium'
                  : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom Tags Filter Row if any tags exist */}
        {allCustomTags.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs overflow-x-auto">
            <span className="text-stone-400 text-[11px] flex items-center gap-1 shrink-0">
              <Tag className="w-3 h-3" />
              <span>Tags livres:</span>
            </span>
            <button
              onClick={() => setSelectedCustomTag(null)}
              className={`px-2 py-0.5 rounded-md text-[11px] cursor-pointer transition-colors ${
                selectedCustomTag === null
                  ? 'bg-teal-700 text-white font-medium'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              Todas
            </button>
            {allCustomTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedCustomTag(selectedCustomTag === t ? null : t)}
                className={`px-2 py-0.5 rounded-md text-[11px] cursor-pointer transition-colors ${
                  selectedCustomTag === t
                    ? 'bg-teal-700 text-white font-medium'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List of Entries */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
          Nenhum registro corresponde aos filtros selecionados.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => {
            const conf = MOOD_LEVEL_CONFIG[entry.moodScore];
            const hasImpulses = entry.impulsiveBehaviors && entry.impulsiveBehaviors.length > 0;
            const dateObj = new Date(entry.date + 'T12:00:00');

            return (
              <div
                key={entry.id}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs hover:border-stone-300 dark:hover:border-stone-700 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800/80 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${conf.bgColor} ${conf.borderColor} border flex items-center justify-center font-mono font-bold text-sm ${conf.color} shrink-0`}
                    >
                      {entry.moodScore > 0 ? `+${entry.moodScore}` : entry.moodScore}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                          {dateObj.toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span aria-hidden="true" className="text-stone-400">·</span>
                        <span className="text-xs text-stone-500 font-mono">{entry.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-0.5">
                        <span className={`font-medium ${conf.color}`}>{conf.clinicalTerm}</span>
                        {entry.isMixedState && (
                          <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Agitação com Desânimo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Biometrics summary */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-3 text-stone-500 font-mono">
                      <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                        <Moon className="w-3.5 h-3.5" />
                        {entry.sleepHours}h ({entry.sleepQuality})
                      </span>
                      <span>Ans: {entry.anxietyLevel}/5</span>
                      <span>Irr: {entry.irritabilityLevel}/5</span>
                    </div>

                    <div className="flex items-center gap-1 border-l border-stone-200 dark:border-stone-700 pl-3">
                      <button
                        onClick={() => onEditEntry(entry)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                        title="Editar registro"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                        title="Excluir registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tags row */}
                <div className="space-y-2 text-xs">
                  {entry.emotions.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-stone-400 text-[11px]">Sentimentos:</span>
                      {entry.emotions.map((emo) => (
                        <span
                          key={emo}
                          className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px]"
                        >
                          {emo}
                        </span>
                      ))}
                    </div>
                  )}

                  {entry.triggers.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-rose-400 text-[11px]">Gatilhos:</span>
                      {entry.triggers.map((trig) => (
                        <span
                          key={trig}
                          className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] border border-rose-200 dark:border-rose-900/60"
                        >
                          {trig}
                        </span>
                      ))}
                    </div>
                  )}

                  {entry.somaticSymptoms && entry.somaticSymptoms.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-amber-500 text-[11px]">Sensações no corpo:</span>
                      {entry.somaticSymptoms.map((som) => (
                        <span
                          key={som}
                          className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px]"
                        >
                          {som}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Impulsive behaviors highlight if present */}
                {hasImpulses && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-semibold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Impulsos Registrados</span>
                    </div>
                    {entry.impulsiveBehaviors.map((imp) => (
                      <div key={imp.id} className="text-stone-700 dark:text-stone-300">
                        <strong>{imp.type}</strong> (Urgência: {imp.intensity}/5) ·{' '}
                        {imp.resisted === 'resisted_fully'
                          ? 'Resistiu totalmente'
                          : imp.resisted === 'delayed'
                          ? 'Adiou com técnica'
                          : imp.resisted === 'yielded_partially'
                          ? 'Cedeu parcialmente'
                          : 'Cedeu ao impulso'}
                        {imp.reflection && (
                          <div className="text-stone-500 italic mt-0.5">
                            "{imp.reflection}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Physical Activity highlight if present */}
                {entry.physicalActivities && entry.physicalActivities.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-teal-800 dark:text-teal-300 font-semibold">
                      <Dumbbell className="w-3.5 h-3.5 text-teal-600" />
                      <span>Atividade Física Realizada</span>
                    </div>
                    <div className="space-y-1">
                      {entry.physicalActivities.map((w, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-2 text-stone-700 dark:text-stone-300">
                          <span className="font-semibold text-teal-900 dark:text-teal-200 bg-teal-100/60 dark:bg-teal-900/40 px-2 py-0.5 rounded text-[11px]">
                            {w.type}
                          </span>
                          <span className="font-mono text-stone-600 dark:text-stone-400 font-medium">{w.durationMinutes} min</span>
                          <span className="text-stone-400">·</span>
                          <span className="text-stone-500">
                            Intensidade: {w.intensity === 'light' ? 'Leve' : w.intensity === 'moderate' ? 'Moderada' : 'Vigorosa'}
                          </span>
                          {w.postWorkoutFeeling && (
                            <>
                              <span className="text-stone-400">·</span>
                              <span className="italic text-teal-800 dark:text-teal-300">
                                "{w.postWorkoutFeeling}"
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proteções / O Que Ajudou highlight if present */}
                {((entry.protectiveFactors && entry.protectiveFactors.length > 0) || entry.whatHelpedNotes) && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>O Que Ajudou a Atravessar o Momento (Proteções & Âncoras)</span>
                    </div>
                    {entry.protectiveFactors && entry.protectiveFactors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.protectiveFactors.map((pf) => (
                          <span
                            key={pf}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-emerald-300/80 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-[11px] font-medium"
                          >
                            {pf}
                          </span>
                        ))}
                      </div>
                    )}
                    {entry.whatHelpedNotes && (
                      <p className="text-emerald-950 dark:text-emerald-200/90 italic mt-1 leading-relaxed">
                        "{entry.whatHelpedNotes}"
                      </p>
                    )}
                  </div>
                )}

                {/* Journal free text */}
                {entry.journalNotes && (
                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    <strong className="text-stone-500 block mb-1">Anotação do Dia:</strong>
                    <p className="whitespace-pre-wrap">{entry.journalNotes}</p>
                  </div>
                )}

                {/* Gratitude Notes */}
                {entry.gratitudeNotes && (
                  <div className="mt-2 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-1.5 bg-teal-50/50 dark:bg-teal-950/20 px-3 py-1.5 rounded-lg border border-teal-200/60 dark:border-teal-900/40">
                    <Heart className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>
                      <strong>Ponto positivo / Autocuidado:</strong> {entry.gratitudeNotes}
                    </span>
                  </div>
                )}

                {/* Medications taken summary */}
                {entry.medicationIntakes && entry.medicationIntakes.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-stone-400 text-[11px] flex items-center gap-1">
                      <Pill className="w-3 h-3 text-teal-600" />
                      <span>Medicações:</span>
                    </span>
                    {entry.medicationIntakes.map((m) => (
                      <span
                        key={m.medicationId}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                          m.status === 'taken'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                            : m.status === 'delayed'
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300'
                            : m.status === 'extra_dose'
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 text-indigo-800 dark:text-indigo-300'
                            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {m.medicationName} ({m.status === 'taken' ? 'Tomado' : m.status === 'delayed' ? 'Atrasado' : m.status === 'extra_dose' ? 'SOS' : 'Não tomado'}
                        {m.timeTaken ? ` às ${m.timeTaken}` : ''})
                      </span>
                    ))}
                  </div>
                )}

                {/* Custom Tags on Card */}
                {entry.customTags && entry.customTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {entry.customTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedCustomTag(selectedCustomTag === tag ? null : tag)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950 dark:hover:text-teal-300 transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
                        title="Filtrar por esta tag"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
