export type MoodScore = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export interface ImpulsiveBehavior {
  id: string;
  type: string;
  intensity: number; // 1 to 5
  resisted: 'resisted_fully' | 'delayed' | 'yielded_partially' | 'yielded_fully';
  copingUsed?: string;
  trigger?: string;
  consequence?: string;
  reflection?: string;
}

export type MedicationCategory =
  | 'mood_stabilizer'
  | 'antidepressant'
  | 'anxiolytic'
  | 'sleep_aid'
  | 'supplement'
  | 'routine'
  | 'other';

export interface UserProfile {
  name: string;
  notes?: string;
  notificationsEnabled: boolean;
}

// Backwards compatibility alias
export type PatientProfile = UserProfile;

export interface Medication {
  id: string;
  name: string;
  category: MedicationCategory;
  dosage: string;
  frequency: 'daily_morning' | 'daily_night' | 'twice_daily' | 'as_needed';
  notes?: string;
  active: boolean;
}

export interface PhysicalActivity {
  id?: string;
  type: string; // 'Corrida', 'Pilates', 'Musculação', 'Caminhada', 'Yoga', 'Natação', 'Ciclismo', 'Alongamento', 'Outro'
  durationMinutes: number; // e.g. 45
  intensity: 'light' | 'moderate' | 'vigorous'; // 'Leve', 'Moderada', 'Intensa'
  postWorkoutFeeling?: string; // 'Mais disposto/energizado', 'Relaxado/menos ansioso', 'Cansaço bom', 'Esgotado'
}

export interface MedicationIntake {
  medicationId: string;
  medicationName: string;
  status: 'taken' | 'skipped' | 'delayed' | 'extra_dose';
  timeTaken?: string; // Horário real da dose (HH:mm)
  sideEffects?: string[];
}

export interface AfetivoEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  moodScore: MoodScore;
  moodLabel: string;
  isMixedState: boolean; // agitação com desânimo simultâneo
  energyLevel: number; // 1 to 5
  anxietyLevel: number; // 0 to 5
  irritabilityLevel: number; // 0 to 5
  sleepHours: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'restorative';
  sleepLatencyMinutes?: number;
  emotions: string[];
  somaticSymptoms: string[];
  triggers: string[];
  activities: string[];
  physicalActivities?: PhysicalActivity[]; // Atividade física (corrida, pilates, musculação, etc.)
  impulsiveBehaviors: ImpulsiveBehavior[];
  medicationIntakes: MedicationIntake[];
  protectiveFactors?: string[]; // Âncoras / Proteções / O que ajudou
  whatHelpedNotes?: string; // Algo ajudou você a atravessar o momento?
  customTags?: string[]; // Tags personalizadas livres criadas pelo usuário
  journalNotes: string;
  gratitudeNotes?: string;
  createdAt: number;
}

export interface CorrelationItem {
  titulo: string;
  observacao: string;
  forca: 'forte' | 'moderada' | 'fraca';
}

export interface PracticalStrategy {
  situacao: string;
  acao_sugerida: string;
}

export interface ClinicalPatternAnalysis {
  resumo_geral: string;
  correlacoes_principais: CorrelationItem[];
  gatilhos_mais_frequentes: string[];
  protecoes_mais_eficazes: string[];
  sinais_de_alerta_previos: string[];
  estrategias_praticas: PracticalStrategy[];
  observacao_exercicio: string;
  ponto_positivo: string;

  // Backward compatibility fields
  summary?: string;
  patterns?: string[];
  sleepCorrelation?: string;
  medicationCorrelation?: string;
  clinicalNotes?: string;
  earlyWarningSigns?: string[];
  suggestedStrategies?: string[];
  protectiveInsights?: string;
  physicalActivityCorrelation?: string;
}

export const MOOD_LEVEL_CONFIG: Record<
  MoodScore,
  {
    label: string;
    description: string;
    clinicalTerm: string;
    color: string;
    bgColor: string;
    borderColor: string;
    zone: 'elevado' | 'equilibrado' | 'baixo';
  }
> = {
  3: {
    label: 'Energia Muito Alta / Euforia',
    description: 'Mente muito acelerada, agitação intensa, excesso de estímulos ou pressa mental.',
    clinicalTerm: 'Muito Elevado (+3)',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/60',
    borderColor: 'border-amber-400',
    zone: 'elevado',
  },
  2: {
    label: 'Muito Animado / Disposto',
    description: 'Muita energia, ideias fluindo com facilidade, entusiasmo alto e impulsos para iniciar múltiplos projetos.',
    clinicalTerm: 'Elevado (+2)',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-950/50',
    borderColor: 'border-orange-400',
    zone: 'elevado',
  },
  1: {
    label: 'Levemente Animado',
    description: 'Bom nível de disposição, mente otimista e ativa, facilidade em realizar as tarefas cotidianas.',
    clinicalTerm: 'Positivo (+1)',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderColor: 'border-yellow-300',
    zone: 'elevado',
  },
  0: {
    label: 'Equilibrado / Neutro',
    description: 'Humor sereno e estável, clareza mental, sem pressa nem apatia, reações proporcionais aos acontecimentos.',
    clinicalTerm: 'Equilibrado (0)',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-300',
    zone: 'equilibrado',
  },
  '-1': {
    label: 'Levemente Desanimado',
    description: 'Energia um pouco mais baixa, leve fadiga ou menor motivação para começar atividades.',
    clinicalTerm: 'Leve Baixa (-1)',
    color: 'text-sky-700 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-300',
    zone: 'baixo',
  },
  '-2': {
    label: 'Desanimado / Triste',
    description: 'Tristeza ou desânimo evidente, desmotivação, sensação de peso ou cansaço acumulado.',
    clinicalTerm: 'Baixo (-2)',
    color: 'text-indigo-700 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderColor: 'border-indigo-300',
    zone: 'baixo',
  },
  '-3': {
    label: 'Muito Desanimado / Esgotado',
    description: 'Sensação de esgotamento total, tristeza marcante, desânimo profundo para atividades rotineiras.',
    clinicalTerm: 'Muito Baixo (-3)',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-950/60',
    borderColor: 'border-purple-400',
    zone: 'baixo',
  },
};
