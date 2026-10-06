import React, { useState } from 'react';
import {
  AfetivoEntry,
  MoodScore,
  MOOD_LEVEL_CONFIG,
  Medication,
  ImpulsiveBehavior,
  MedicationIntake,
  PhysicalActivity,
} from '../types/mood';
import {
  X,
  Moon,
  Zap,
  Pill,
  Heart,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  Dumbbell,
  ArrowRight,
  ArrowLeft,
  Copy,
  Sparkles,
  CheckCircle2,
  Tag,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  medications: Medication[];
  onSave: (entry: AfetivoEntry) => void;
  onClose: () => void;
  initialEntry?: AfetivoEntry | null;
  lastEntry?: AfetivoEntry | null;
}

const WORKOUT_TYPES = [
  'Musculação',
  'Corrida',
  'Pilates',
  'Caminhada',
  'Yoga',
  'Natação',
  'Ciclismo',
  'Alongamento',
  'Luta / Artes Marciais',
  'Dança',
  'Outro',
];

const WORKOUT_FEELINGS = [
  'Mais disposto / energizado',
  'Mente leve / menos ansioso',
  'Cansaço relaxante',
  'Sensação de dever cumprido',
  'Esgotado / cansaço excessivo',
];

const COMMON_PROTECTIONS = [
  'Conversar com alguém de confiança',
  'Pausa e respiração consciente',
  'Caminhada ao ar livre / natureza',
  'Afastei o celular / redes sociais',
  'Banho relaxante / autocuidado',
  'Ouvir música ou sons calmos',
  'Contato com pet / animal',
  'Praticar atividade física',
  'Escrever no papel / desabafar',
  'Beber água e esperar 15 minutos',
  'Descansar sem autocobrança',
  'Lembrar das minhas prioridades',
];

const COMMON_EMOTIONS = [
  'Tranquilo',
  'Esperançoso',
  'Ansioso',
  'Sobrecarregado',
  'Calmo',
  'Eufórico',
  'Irritável',
  'Culpado',
  'Vazio',
  'Focado',
  'Desanimado',
  'Agradecido',
  'Inquieto',
  'Solitário',
  'Entusiasmado',
  'Conectado',
  'Frustrado',
  'Aliviado',
];

const COMMON_SOMATIC = [
  'Aperto no peito',
  'Tensão muscular',
  'Fadiga física',
  'Taquicardia',
  'Nó na garganta',
  'Inquietação motora',
  'Cefaleia / Dor de cabeça',
  'Desconforto digestivo',
  'Bruxismo / Mandíbula travada',
];

const COMMON_TRIGGERS = [
  'Poucas horas de sono',
  'Conflito interpessoal',
  'Pressão / Prazo de trabalho',
  'Notícias / Redes sociais',
  'Cafeína no fim da tarde',
  'Consumo de álcool',
  'Preocupação financeira',
  'Mudança na rotina',
  'Sensação de rejeição',
  'Isolamento excessivo',
];

const COMMON_ACTIVITIES = [
  'Trabalho focado',
  'Exercício físico',
  'Terapia / Conversa',
  'Social com amigos',
  'Tempo em família',
  'Lazer / Hobbies',
  'Meditação / Respiração',
  'Leitura',
  'Contato com a natureza',
  'Organização da casa',
  'Descanso passivo',
];

const IMPULSE_TYPES = [
  'Gastos / Compras impulsivas',
  'Compulsão alimentar',
  'Scrolling excessivo / Telas',
  'Checagem repetitiva',
  'Discussão / Reatividade verbal',
  'Consumo de álcool ou substâncias',
  'Direção arriscada ou pressa extrema',
  'Abandono de tarefa / Dispersão',
  'Outro impulso',
];

const COMMON_COPING = [
  'Regra de adiar 15 minutos',
  'Água gelada no rosto para desacelerar',
  'Respiração consciente lenta',
  'Caminhada rápida / sair do ambiente',
  'Conversa com pessoa de confiança',
  'Afastar o celular ou fechar abas',
  'Nenhuma técnica utilizada',
];

const STEP_TITLES = [
  'Humor & Energia',
  'Sono & Corpo',
  'O que Aconteceu',
  'Exercício Físico',
  'Impulsos & DBT',
  'O que Ajudou (Âncoras)',
  'Medicações & Rotina',
  'Anotação & Ponto Positivo',
];

export const QuickMoodLogger: React.FC<Props> = ({
  medications,
  onSave,
  onClose,
  initialEntry,
  lastEntry,
}) => {
  // Step navigation (1 to 8)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState(initialEntry?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialEntry?.time || new Date().toTimeString().slice(0, 5));
  const [moodScore, setMoodScore] = useState<MoodScore>(initialEntry?.moodScore ?? 0);
  const [isMixedState, setIsMixedState] = useState(initialEntry?.isMixedState ?? false);
  const [sleepHours, setSleepHours] = useState<number>(initialEntry?.sleepHours ?? 7.5);
  const [sleepQuality, setSleepQuality] = useState<'poor' | 'fair' | 'good' | 'restorative'>(
    initialEntry?.sleepQuality || 'good'
  );
  const [energyLevel, setEnergyLevel] = useState<number>(initialEntry?.energyLevel ?? 3);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(initialEntry?.anxietyLevel ?? 1);
  const [irritabilityLevel, setIrritabilityLevel] = useState<number>(initialEntry?.irritabilityLevel ?? 1);

  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(initialEntry?.emotions || []);
  const [selectedSomatic, setSelectedSomatic] = useState<string[]>(initialEntry?.somaticSymptoms || []);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(initialEntry?.triggers || []);
  const [selectedActivities, setSelectedActivities] = useState<string[]>(initialEntry?.activities || []);

  // Physical Activity
  const [hasWorkout, setHasWorkout] = useState<boolean>(
    initialEntry?.physicalActivities && initialEntry.physicalActivities.length > 0 ? true : false
  );
  const [workouts, setWorkouts] = useState<PhysicalActivity[]>(
    initialEntry?.physicalActivities || []
  );
  const [workoutType, setWorkoutType] = useState<string>('Musculação');
  const [workoutDuration, setWorkoutDuration] = useState<number>(45);
  const [workoutIntensity, setWorkoutIntensity] = useState<'light' | 'moderate' | 'vigorous'>('moderate');
  const [workoutFeeling, setWorkoutFeeling] = useState<string>(WORKOUT_FEELINGS[0]);

  // Impulsive Behaviors
  const [hasImpulses, setHasImpulses] = useState<boolean>(
    initialEntry?.impulsiveBehaviors && initialEntry.impulsiveBehaviors.length > 0 ? true : false
  );
  const [impulses, setImpulses] = useState<ImpulsiveBehavior[]>(
    initialEntry?.impulsiveBehaviors || []
  );
  const [newImpulseType, setNewImpulseType] = useState(IMPULSE_TYPES[0]);
  const [newImpulseIntensity, setNewImpulseIntensity] = useState(3);
  const [newImpulseResisted, setNewImpulseResisted] = useState<
    'resisted_fully' | 'delayed' | 'yielded_partially' | 'yielded_fully'
  >('delayed');
  const [newImpulseCoping, setNewImpulseCoping] = useState(COMMON_COPING[0]);
  const [newImpulseReflection, setNewImpulseReflection] = useState('');

  // Medications
  const [medIntakes, setMedIntakes] = useState<MedicationIntake[]>(() => {
    if (initialEntry?.medicationIntakes && initialEntry.medicationIntakes.length > 0) {
      return initialEntry.medicationIntakes;
    }
    return medications.map((m) => ({
      medicationId: m.id,
      medicationName: m.name,
      status: 'taken',
      sideEffects: [],
    }));
  });

  // Protections & Anchors
  const [selectedProtections, setSelectedProtections] = useState<string[]>(
    initialEntry?.protectiveFactors || []
  );
  const [whatHelpedNotes, setWhatHelpedNotes] = useState(
    initialEntry?.whatHelpedNotes || ''
  );

  // Custom Tags
  const [customTags, setCustomTags] = useState<string[]>(initialEntry?.customTags || []);
  const [newCustomTagInput, setNewCustomTagInput] = useState('');

  // Notes
  const [journalNotes, setJournalNotes] = useState(initialEntry?.journalNotes || '');
  const [gratitudeNotes, setGratitudeNotes] = useState(initialEntry?.gratitudeNotes || '');

  const toggleArrayItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleAddWorkout = () => {
    const newWorkout: PhysicalActivity = {
      id: `w-${Date.now()}`,
      type: workoutType,
      durationMinutes: Number(workoutDuration) || 30,
      intensity: workoutIntensity,
      postWorkoutFeeling: workoutFeeling,
    };
    setWorkouts([...workouts, newWorkout]);
  };

  const handleRemoveWorkout = (index: number) => {
    setWorkouts(workouts.filter((_, i) => i !== index));
  };

  const handleAddImpulse = () => {
    const item: ImpulsiveBehavior = {
      id: `imp-${Date.now()}`,
      type: newImpulseType,
      intensity: newImpulseIntensity,
      resisted: newImpulseResisted,
      copingUsed: newImpulseCoping,
      reflection: newImpulseReflection.trim() || undefined,
    };
    setImpulses([...impulses, item]);
    setNewImpulseReflection('');
  };

  const handleRemoveImpulse = (id: string) => {
    setImpulses(impulses.filter((i) => i.id !== id));
  };

  const handleMedStatusChange = (medId: string, status: 'taken' | 'skipped' | 'delayed' | 'extra_dose') => {
    setMedIntakes((prev) =>
      prev.map((item) => (item.medicationId === medId ? { ...item, status } : item))
    );
  };

  const handleMedTimeChange = (medId: string, timeTaken: string) => {
    setMedIntakes((prev) =>
      prev.map((item) => (item.medicationId === medId ? { ...item, timeTaken } : item))
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = newCustomTagInput.trim().replace(/^#/, '');
    if (trimmed && !customTags.includes(trimmed)) {
      setCustomTags([...customTags, trimmed]);
      setNewCustomTagInput('');
    }
  };

  const handleRemoveCustomTag = (tag: string) => {
    setCustomTags(customTags.filter((t) => t !== tag));
  };

  const handleDuplicateYesterday = () => {
    if (!lastEntry) return;
    setMoodScore(lastEntry.moodScore);
    setIsMixedState(lastEntry.isMixedState);
    setSleepHours(lastEntry.sleepHours);
    setSleepQuality(lastEntry.sleepQuality);
    setEnergyLevel(lastEntry.energyLevel);
    setAnxietyLevel(lastEntry.anxietyLevel);
    setIrritabilityLevel(lastEntry.irritabilityLevel);
    setSelectedEmotions(lastEntry.emotions || []);
    setSelectedSomatic(lastEntry.somaticSymptoms || []);
    setSelectedTriggers(lastEntry.triggers || []);
    setSelectedActivities(lastEntry.activities || []);
    if (lastEntry.physicalActivities && lastEntry.physicalActivities.length > 0) {
      setHasWorkout(true);
      setWorkouts(lastEntry.physicalActivities);
    }
    if (lastEntry.protectiveFactors && lastEntry.protectiveFactors.length > 0) {
      setSelectedProtections(lastEntry.protectiveFactors);
    }
    if (lastEntry.medicationIntakes) {
      setMedIntakes(lastEntry.medicationIntakes);
    }
    if (lastEntry.customTags) {
      setCustomTags(lastEntry.customTags);
    }
    setDuplicateMessage('Valores e rotinas de ontem duplicados para hoje! Ajuste conforme desejar.');
    setTimeout(() => setDuplicateMessage(null), 3500);
  };

  const executeSave = () => {
    const config = MOOD_LEVEL_CONFIG[moodScore];

    const finalWorkouts: PhysicalActivity[] = hasWorkout
      ? workouts.length > 0
        ? workouts
        : [
            {
              id: `w-${Date.now()}`,
              type: workoutType,
              durationMinutes: Number(workoutDuration) || 30,
              intensity: workoutIntensity,
              postWorkoutFeeling: workoutFeeling,
            },
          ]
      : [];

    const entry: AfetivoEntry = {
      id: initialEntry?.id || `entry-${Date.now()}`,
      date,
      time,
      moodScore,
      moodLabel: config.label,
      isMixedState,
      energyLevel,
      anxietyLevel,
      irritabilityLevel,
      sleepHours,
      sleepQuality,
      emotions: selectedEmotions,
      somaticSymptoms: selectedSomatic,
      triggers: selectedTriggers,
      activities: selectedActivities,
      physicalActivities: finalWorkouts,
      impulsiveBehaviors: hasImpulses ? impulses : [],
      medicationIntakes: medIntakes,
      protectiveFactors: selectedProtections,
      whatHelpedNotes: whatHelpedNotes.trim() || undefined,
      customTags,
      journalNotes: journalNotes.trim(),
      gratitudeNotes: gratitudeNotes.trim() || undefined,
      createdAt: initialEntry?.createdAt || Date.now(),
    };

    setIsSavedSuccess(true);
    setTimeout(() => {
      onSave(entry);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSave();
  };

  // Quick Mode Save (Instant Save in Step 1)
  const handleQuickSave = () => {
    executeSave();
  };

  if (isSavedSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-8 max-w-sm w-full text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-300">
            <Check className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Registro Salvo!
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Você está construindo clareza e autorregulação a cada dia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((currentStep / 8) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col my-auto">
        {/* Modal Top Header */}
        <div className="px-5 sm:px-6 pt-4 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[11px] font-mono uppercase text-teal-700 dark:text-teal-400 font-semibold tracking-wider">
                Etapa {currentStep} de 8 · {STEP_TITLES[currentStep - 1]}
              </span>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {initialEntry ? 'Editar Registro Diário' : 'Registro de Autoconhecimento'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {duplicateMessage && (
            <div className="mt-2 p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{duplicateMessage}</span>
            </div>
          )}
        </div>

        {/* Form Body with Progressive Disclosure Steps */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 flex-1 text-xs space-y-5">
          {/* STEP 1: HUMOR & ENERGIA */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Date & Time with Fast-Track Shortcuts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-mono block">Data</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-mono block">Horário</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Shortcuts: Duplicar ontem e Modo rápido */}
                <div className="flex items-center gap-2">
                  {lastEntry && (
                    <button
                      type="button"
                      onClick={handleDuplicateYesterday}
                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1.5 cursor-pointer text-[11px]"
                      title="Copiar hábitos e medicações do registro anterior"
                    >
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span>Duplicar o de ontem</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleQuickSave}
                    className="px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-semibold flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Salvar Modo Rápido (30s)</span>
                  </button>
                </div>
              </div>

              {/* Mood Level Selector (-3 to +3) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Como você avalia seu nível de energia e humor hoje?
                  </label>
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-400 font-mono">
                    {MOOD_LEVEL_CONFIG[moodScore].clinicalTerm}
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {([-3, -2, -1, 0, 1, 2, 3] as MoodScore[]).map((score) => {
                    const isSelected = moodScore === score;
                    const conf = MOOD_LEVEL_CONFIG[score];
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setMoodScore(score)}
                        className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? `${conf.bgColor} ${conf.borderColor} border-2 shadow-xs font-bold ring-2 ring-teal-500/20`
                            : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                        }`}
                      >
                        <span
                          className={`text-lg font-mono tabular-nums ${
                            isSelected ? conf.color : 'text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {score > 0 ? `+${score}` : score}
                        </span>
                        <span className="text-[10px] leading-tight text-stone-500 line-clamp-1 mt-0.5">
                          {score === 0 ? 'Equilíbrio' : score > 0 ? `+${score}` : score}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300">
                  <strong className="text-stone-900 dark:text-stone-100">
                    {MOOD_LEVEL_CONFIG[moodScore].label}:
                  </strong>{' '}
                  {MOOD_LEVEL_CONFIG[moodScore].description}
                </div>
              </div>

              {/* Mixed State Checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMixedState}
                  onChange={(e) => setIsMixedState(e.target.checked)}
                  className="rounded border-stone-300 text-rose-600 focus:ring-rose-500 w-4 h-4 mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Agitação com desânimo simultâneos</span>
                  </span>
                  <p className="text-stone-500 text-[11px] mt-0.5 leading-relaxed">
                    Marque se sentiu inquietação física ou aceleração mental ao mesmo tempo em que sentia tristeza, desânimo ou cansaço profundo.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* STEP 2: SONO & BIOMETRIA */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
                <Moon className="w-4 h-4 text-sky-600" />
                <span>Sono da Noite Anterior & Níveis Corporais</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Horas de Sono: <span className="font-mono text-sky-600 font-bold">{sleepHours}h</span>
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-0.5">
                    <span>3h</span>
                    <span>6.5h</span>
                    <span>8h</span>
                    <span>12h</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Qualidade do Sono
                  </label>
                  <select
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs"
                  >
                    <option value="restorative">Descanso Excelente / Restaurador</option>
                    <option value="good">Bom / Dormi Bem</option>
                    <option value="fair">Regular / Acordei Cansado</option>
                    <option value="poor">Ruim / Interrompido / Insônia</option>
                  </select>
                </div>
              </div>

              {/* Sliders: Energia, Ansiedade, Irritabilidade */}
              <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Disposição & Energia Física</span>
                    <span className="font-mono text-teal-600 font-bold">{energyLevel}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Tensão / Ansiedade Sentida</span>
                    <span className="font-mono text-teal-600 font-bold">{anxietyLevel}/5</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={anxietyLevel}
                    onChange={(e) => setAnxietyLevel(parseInt(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Irritabilidade / Reatividade</span>
                    <span className="font-mono text-rose-600 font-bold">{irritabilityLevel}/5</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={irritabilityLevel}
                    onChange={(e) => setIrritabilityLevel(parseInt(e.target.value))}
                    className="w-full accent-rose-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: O QUE ACONTECEU HOJE (GATILHOS & ATIVIDADES) */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1.5">
                  Emoções presentes hoje (selecione as que sentiu):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_EMOTIONS.map((emo) => {
                    const active = selectedEmotions.includes(emo);
                    return (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => toggleArrayItem(selectedEmotions, emo, setSelectedEmotions)}
                        className={`px-2.5 py-1 rounded-xl text-xs transition-colors border cursor-pointer ${
                          active
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 font-medium'
                            : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        {emo}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1.5">
                  Sensações físicas no corpo:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SOMATIC.map((som) => {
                    const active = selectedSomatic.includes(som);
                    return (
                      <button
                        key={som}
                        type="button"
                        onClick={() => toggleArrayItem(selectedSomatic, som, setSelectedSomatic)}
                        className={`px-2.5 py-1 rounded-xl text-xs transition-colors border cursor-pointer ${
                          active
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300 font-medium'
                            : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        {som}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1.5">
                  Gatilhos ambientais ou situações desafiadoras:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_TRIGGERS.map((trig) => {
                    const active = selectedTriggers.includes(trig);
                    return (
                      <button
                        key={trig}
                        type="button"
                        onClick={() => toggleArrayItem(selectedTriggers, trig, setSelectedTriggers)}
                        className={`px-2.5 py-1 rounded-xl text-xs transition-colors border cursor-pointer ${
                          active
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border-rose-300 font-medium'
                            : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        {trig}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ATIVIDADE FÍSICA (CORRIDA, PILATES, MUSCULAÇÃO...) */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
                <Dumbbell className="w-4 h-4 text-teal-600" />
                <span>Atividade Física & Exercício</span>
              </div>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasWorkout}
                  onChange={(e) => setHasWorkout(e.target.checked)}
                  className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    Pratiquei atividade física hoje
                  </span>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    Corrida, pilates, musculação, caminhada, yoga, natação, etc.
                  </p>
                </div>
              </label>

              {hasWorkout && (
                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Modalidade:
                      </label>
                      <select
                        value={workoutType}
                        onChange={(e) => setWorkoutType(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      >
                        {WORKOUT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Duração (min):
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        step="5"
                        value={workoutDuration}
                        onChange={(e) => setWorkoutDuration(parseInt(e.target.value) || 30)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Intensidade:
                      </label>
                      <select
                        value={workoutIntensity}
                        onChange={(e) => setWorkoutIntensity(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      >
                        <option value="light">Leve / Recuperativa</option>
                        <option value="moderate">Moderada</option>
                        <option value="vigorous">Vigorosa / Intensa</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Sensação corporal pós-treino:
                    </label>
                    <select
                      value={workoutFeeling}
                      onChange={(e) => setWorkoutFeeling(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    >
                      {WORKOUT_FEELINGS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddWorkout}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-medium text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar este treino à lista</span>
                  </button>

                  {workouts.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-teal-200/60 dark:border-teal-900">
                      <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                        Treinos registrados hoje:
                      </span>
                      {workouts.map((w, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-stone-900 border border-teal-200/80 dark:border-teal-900 text-xs"
                        >
                          <span>
                            <strong>{w.type}</strong> ({w.durationMinutes} min, {w.intensity}) - <em>{w.postWorkoutFeeling}</em>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveWorkout(idx)}
                            className="text-stone-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: MONITORAMENTO DE IMPULSOS (DBT / TCC) */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
                <Zap className="w-4 h-4 text-rose-600" />
                <span>Espaço Entre o Impulso e a Ação (DBT)</span>
              </div>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasImpulses}
                  onChange={(e) => setHasImpulses(e.target.checked)}
                  className="rounded border-stone-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    Senti impulsos que demandaram atenção hoje
                  </span>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    Compras urgentes, telas excessivas, compulsão alimentar, reatividade verbal...
                  </p>
                </div>
              </label>

              {hasImpulses && (
                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Tipo de impulso:
                      </label>
                      <select
                        value={newImpulseType}
                        onChange={(e) => setNewImpulseType(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      >
                        {IMPULSE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Desfecho (Regra dos 15 minutos):
                      </label>
                      <select
                        value={newImpulseResisted}
                        onChange={(e) => setNewImpulseResisted(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      >
                        <option value="resisted_fully">Resisti totalmente</option>
                        <option value="delayed">Adiei por 15+ minutos (Espaço criado)</option>
                        <option value="yielded_partially">Cedi parcialmente</option>
                        <option value="yielded_fully">Cedi ao impulso</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Estratégia usada:
                    </label>
                    <select
                      value={newImpulseCoping}
                      onChange={(e) => setNewImpulseCoping(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    >
                      {COMMON_COPING.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Breve reflexão (o que aconteceu antes/depois):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Tive um dia estressante e quis comprar algo para aliviar..."
                      value={newImpulseReflection}
                      onChange={(e) => setNewImpulseReflection(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddImpulse}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Salvar este impulso</span>
                  </button>

                  {impulses.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-rose-200 dark:border-rose-900">
                      {impulses.map((imp) => (
                        <div
                          key={imp.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-stone-900 border border-rose-200 dark:border-rose-900 text-xs"
                        >
                          <span>
                            <strong>{imp.type}</strong> · {imp.resisted === 'resisted_fully' ? 'Resistiu' : imp.resisted === 'delayed' ? 'Adiou 15min' : 'Cedeu'} ({imp.copingUsed})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveImpulse(imp.id)}
                            className="text-stone-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: PROTEÇÕES & O QUE AJUDOU (ÂNCORAS) */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>O Que Ajudou Você Hoje? (Proteções & Âncoras)</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Identificar o que funcionou transforma o diário de um registro de sofrimento em uma ferramenta de repertório protetivo.
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Selecione as atitudes e apoios que fizeram bem:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_PROTECTIONS.map((prot) => {
                    const active = selectedProtections.includes(prot);
                    return (
                      <button
                        key={prot}
                        type="button"
                        onClick={() => toggleArrayItem(selectedProtections, prot, setSelectedProtections)}
                        className={`px-2.5 py-1 rounded-xl text-xs transition-colors border cursor-pointer ${
                          active
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-400 font-medium'
                            : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        {prot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Como isso te ajudou a atravessar o momento? (Anotação opcional):
                </label>
                <input
                  type="text"
                  value={whatHelpedNotes}
                  onChange={(e) => setWhatHelpedNotes(e.target.value)}
                  placeholder="Ex: Liguei para um amigo e me acalmei; dar uma volta no quarteirão impediu uma compra..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 7: MEDICAÇÕES & ROTINA */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>Medicações & Suplementos da Rotina</span>
              </div>

              {medications.length === 0 ? (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 text-stone-500 text-xs">
                  Nenhum medicamento ou suplemento cadastrado na aba "Medicações". Você pode cadastrar sua rotina para acompanhar adesão e cruzamento com o sono.
                </div>
              ) : (
                <div className="space-y-2">
                  {medIntakes.map((intake) => {
                    const med = medications.find((m) => m.id === intake.medicationId);
                    if (!med) return null;

                    return (
                      <div
                        key={intake.medicationId}
                        className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50/50 dark:bg-stone-800/30"
                      >
                        <div>
                          <span className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                            {med.name} {med.dosage}
                          </span>
                          <span className="text-[11px] text-stone-500 ml-2">
                            ({med.frequency.replace('_', ' ')})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleMedStatusChange(intake.medicationId, 'taken')}
                            className={`px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                              intake.status === 'taken'
                                ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            Tomado
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMedStatusChange(intake.medicationId, 'delayed')}
                            className={`px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                              intake.status === 'delayed'
                                ? 'bg-amber-100 dark:bg-amber-950 border-amber-400 text-amber-800 dark:text-amber-300 font-bold'
                                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            Atrasado
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMedStatusChange(intake.medicationId, 'skipped')}
                            className={`px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                              intake.status === 'skipped'
                                ? 'bg-rose-100 dark:bg-rose-950 border-rose-400 text-rose-800 dark:text-rose-300 font-bold'
                                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            Não tomei
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMedStatusChange(intake.medicationId, 'extra_dose')}
                            className={`px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                              intake.status === 'extra_dose'
                                ? 'bg-indigo-100 dark:bg-indigo-950 border-indigo-400 text-indigo-800 dark:text-indigo-300 font-bold'
                                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            SOS
                          </button>

                          {intake.status !== 'skipped' && (
                            <div className="flex items-center gap-1 ml-1 text-stone-500 font-mono">
                              <span className="text-[10px]">às</span>
                              <input
                                type="time"
                                value={intake.timeTaken || ''}
                                onChange={(e) => handleMedTimeChange(intake.medicationId, e.target.value)}
                                className="px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 8: ANOTAÇÃO LIVRE & PONTO POSITIVO */}
          {currentStep === 8 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
                  Anotação Livre / Journaling do Dia (opcional):
                </label>
                <textarea
                  rows={3}
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  placeholder="Como foi seu dia? O que chamou sua atenção nos seus pensamentos ou no ambiente?"
                  className="w-full px-3 py-2 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-800 dark:text-teal-300 mb-1 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-teal-600" />
                  <span>Ponto Positivo / Gratidão / Autocuidado (opcional):</span>
                </label>
                <input
                  type="text"
                  value={gratitudeNotes}
                  onChange={(e) => setGratitudeNotes(e.target.value)}
                  placeholder="Algo positivo que aconteceu ou um momento de tranquilidade..."
                  className="w-full px-3 py-2 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none"
                />
              </div>

              {/* Custom Tags */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-stone-500" />
                  <span>Tags Personalizadas Livres (#tags):</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCustomTagInput}
                    onChange={(e) => setNewCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="Ex: #home-office, #viagem, #terapia..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-medium cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
                {customTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {customTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-mono flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomTag(tag)}
                          className="hover:text-rose-500 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Fixed Footer Bar with Step Navigation & Universal Save Button */}
        <div className="px-5 sm:px-6 py-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 rounded-b-3xl flex items-center justify-between gap-3">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-medium flex items-center gap-1.5 hover:bg-white dark:hover:bg-stone-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 8 ? (
              <>
                {/* Always-accessible Save Button (< 90 seconds guarantee) */}
                <button
                  type="button"
                  onClick={executeSave}
                  className="px-3.5 py-2 rounded-xl border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-medium cursor-pointer"
                >
                  Salvar Agora
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(8, prev + 1))}
                  className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={executeSave}
                className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Concluir e Salvar Registro</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
