import { impulseLabel } from './observations';
import { localDate } from './dates';
import { validateEntries, validateMedications, validateProfile } from './validation';
import { AfetivoEntry, Medication, UserProfile, PatientProfile } from '../types/mood';
import { ENTRY_DRAFT_STORAGE_KEY } from './entryDraft';

export const DATA_CHANGED_EVENT = 'afetivo-data-changed';
function dataChanged() { if (typeof window !== 'undefined') window.dispatchEvent(new Event(DATA_CHANGED_EVENT)); }

const ENTRIES_STORAGE_KEY = 'afetivo_entries_v2';
const OLD_ENTRIES_STORAGE_KEY = 'afetivo_entries_v1';
const MEDICATIONS_STORAGE_KEY = 'afetivo_medications_v2';
const OLD_MEDICATIONS_STORAGE_KEY = 'afetivo_medications_v1';
const USER_PROFILE_KEY = 'afetivo_user_profile_v2';
const OLD_PATIENT_PROFILE_KEY = 'afetivo_patient_profile_v1';

export type { UserProfile, PatientProfile };

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: 'Acompanhamento de Rotina Manhã',
    category: 'supplement',
    dosage: '1 dose',
    frequency: 'daily_morning',
    notes: 'Tomar pela manhã após café para manter constância',
    active: true,
  },
  {
    id: 'med-2',
    name: 'Suplemento / Magnésio Noturno',
    category: 'sleep_aid',
    dosage: '300mg',
    frequency: 'daily_night',
    notes: 'Para desacelerar e favorecer relaxamento do sono',
    active: true,
  },
  {
    id: 'med-3',
    name: 'Hidratação & Autocuidado',
    category: 'other',
    dosage: '500ml',
    frequency: 'daily_morning',
    notes: 'Beber água e fazer pausa consciente',
    active: true,
  },
];

// Helper to generate dates relative to current date (e.g. past 14 days)
export function generateInitialSeedEntries(): AfetivoEntry[] {
  const entries: AfetivoEntry[] = [];
  const today = new Date();

  const scenarios = [
    {
      daysAgo: 13,
      moodScore: 0 as const,
      moodLabel: 'Equilibrado / Neutro',
      isMixedState: false,
      sleepHours: 7.5,
      sleepQuality: 'good' as const,
      energyLevel: 3,
      anxietyLevel: 1,
      irritabilityLevel: 1,
      emotions: ['Tranquilo', 'Focado', 'Calmo'],
      somaticSymptoms: [],
      triggers: ['Rotina de trabalho organizada'],
      activities: ['Trabalho', 'Caminhada', 'Leitura'],
      physicalActivities: [
        {
          id: 'w-seed-1',
          type: 'Caminhada',
          durationMinutes: 30,
          intensity: 'light' as const,
          postWorkoutFeeling: 'Mente leve / menos ansioso',
        },
      ],
      impulsiveBehaviors: [],
      protectiveFactors: ['Caminhada ao ar livre / natureza', 'Pausa e respiração consciente'],
      whatHelpedNotes: 'Caminhada tranquila no fim da tarde me ajudou a desacelerar do dia de trabalho.',
      journalNotes: 'Dia calmo e produtivo. Dormi bem e acordei com disposição equilibrada.',
      medIntakeStatus: 'taken' as const,
    },
    {
      daysAgo: 12,
      moodScore: 0 as const,
      moodLabel: 'Equilibrado / Neutro',
      isMixedState: false,
      sleepHours: 7.0,
      sleepQuality: 'good' as const,
      energyLevel: 3,
      anxietyLevel: 1,
      irritabilityLevel: 1,
      emotions: ['Conectado', 'Agradecido'],
      somaticSymptoms: [],
      triggers: [],
      activities: ['Trabalho', 'Exercício físico', 'Social com amigos'],
      physicalActivities: [
        {
          id: 'w-seed-2',
          type: 'Musculação',
          durationMinutes: 50,
          intensity: 'moderate' as const,
          postWorkoutFeeling: 'Mais disposto / energizado',
        },
      ],
      impulsiveBehaviors: [],
      protectiveFactors: ['Praticar atividade física'],
      whatHelpedNotes: 'Fazer o treino de musculação deu uma boa sensação de dever cumprido.',
      journalNotes: 'Almocei com amigos. Dia leve, mantive a rotina de hábitos e hidratação no horário correto.',
      customTags: ['#musculacao', '#social', '#energia'],
      medIntakeStatus: 'taken' as const,
    },
    {
      daysAgo: 11,
      moodScore: 1 as const,
      moodLabel: 'Levemente Animado',
      isMixedState: false,
      sleepHours: 6.0,
      sleepQuality: 'fair' as const,
      energyLevel: 4,
      anxietyLevel: 2,
      irritabilityLevel: 2,
      emotions: ['Entusiasmado', 'Otimista', 'Inquieto'],
      somaticSymptoms: ['Inquietação motora'],
      triggers: ['Novo projeto empolgante', 'Cafeína no fim da tarde'],
      activities: ['Trabalho focado', 'Estudo'],
      impulsiveBehaviors: [],
      journalNotes: 'Muitas ideias surgindo. Fiquei trabalhando até mais tarde e tomei café às 18h.',
      medIntakeStatus: 'taken' as const,
    },
    {
      daysAgo: 10,
      moodScore: 2 as const,
      moodLabel: 'Muito Animado / Disposto',
      isMixedState: false,
      sleepHours: 4.5,
      sleepQuality: 'poor' as const,
      energyLevel: 5,
      anxietyLevel: 3,
      irritabilityLevel: 4,
      emotions: ['Eufórico', 'Impaciente', 'Sobrecarregado'],
      somaticSymptoms: ['Taquicardia leve', 'Inquietação motora'],
      triggers: ['Poucas horas de sono', 'Navegação tarde da noite'],
      activities: ['Compras online', 'Trabalho'],
      impulsiveBehaviors: [
        {
          id: 'imp-1',
          type: 'Gastos / Compras impulsivas',
          intensity: 4,
          resisted: 'yielded_fully' as const,
          trigger: 'Navegação de madrugada em sites de compras',
          consequence: 'Gasto financeiro não planejado',
          reflection: 'Percebi que comprei pela agitação da madrugada e por estar sem sono.',
        },
      ],
      journalNotes: 'Dormi pouco mais de 4 horas mas acordei acelerado. Acabei fazendo compras sem planejamento.',
      medIntakeStatus: 'delayed' as const,
    },
    {
      daysAgo: 9,
      moodScore: 2 as const,
      moodLabel: 'Muito Animado / Disposto',
      isMixedState: true,
      sleepHours: 4.0,
      sleepQuality: 'poor' as const,
      energyLevel: 5,
      anxietyLevel: 4,
      irritabilityLevel: 5,
      emotions: ['Irritável', 'Acelerado', 'Frustrado'],
      somaticSymptoms: ['Aperto no peito', 'Tensão muscular'],
      triggers: ['Cobrança no trabalho', 'Sono acumulado'],
      activities: ['Trabalho sob pressão'],
      impulsiveBehaviors: [
        {
          id: 'imp-2',
          type: 'Discussão / Reatividade verbal',
          intensity: 4,
          resisted: 'yielded_partially' as const,
          copingUsed: 'Saí do ambiente para tomar água e respirar',
          trigger: 'Sentimento de crítica injusta',
          reflection: 'Pavio curto devido ao cansaço oculto. Preciso respirar antes de responder.',
        },
      ],
      protectiveFactors: ['Beber água e esperar 15 minutos', 'Pausa e respiração consciente'],
      whatHelpedNotes: 'Levantar e beber um copo d água antes de falar evitou que eu perdesse a cabeça.',
      journalNotes: 'Sensação contraditória: corpo acelerado, mas cabeça tensa e irritável. Cansaço acumulado.',
      medIntakeStatus: 'taken' as const,
    },
    {
      daysAgo: 8,
      moodScore: 1 as const,
      moodLabel: 'Levemente Animado',
      isMixedState: false,
      sleepHours: 6.5,
      sleepQuality: 'fair' as const,
      energyLevel: 3,
      anxietyLevel: 3,
      irritabilityLevel: 3,
      emotions: ['Cansado', 'Ansioso', 'Reflexivo'],
      somaticSymptoms: ['Tensão muscular'],
      triggers: ['Cansaço da semana'],
      activities: ['Terapia / Conversa', 'Pilates'],
      physicalActivities: [
        {
          id: 'w-seed-3',
          type: 'Pilates',
          durationMinutes: 45,
          intensity: 'moderate' as const,
          postWorkoutFeeling: 'Cansaço relaxante',
        },
      ],
      impulsiveBehaviors: [],
      protectiveFactors: ['Conversar com alguém de confiança', 'Caminhada ao ar livre / natureza', 'Praticar atividade física'],
      whatHelpedNotes: 'A aula de Pilates me ajudou a soltar a tensão nos ombros e a conversa na terapia tirou o peso.',
      journalNotes: 'Conversa reflexiva boa. Percebi com clareza como a falta de sono desencadeou a impulsividade.',
      medIntakeStatus: 'taken' as const,
    },
    {
      daysAgo: 7,
      moodScore: -1 as const,
      moodLabel: 'Levemente Desanimado',
      isMixedState: false,
      sleepHours: 9.0,
      sleepQuality: 'poor' as const,
      energyLevel: 2,
      anxietyLevel: 2,
      irritabilityLevel: 1,
      emotions: ['Desanimado', 'Culpado', 'Cansaço'],
      somaticSymptoms: ['Fadiga física', 'Sensação de peso'],
      triggers: ['Queda de energia após dias acelerados'],
      activities: ['Descanso no quarto'],
      impulsiveBehaviors: [
        {
          id: 'imp-3',
          type: 'Compulsão alimentar',
          intensity: 3,
          resisted: 'yielded_partially' as const,
          copingUsed: 'Bebi um copo de água antes',
          trigger: 'Tristeza e desânimo após os dias de agitação',
          reflection: 'Comi doces tentando aliviar o desânimo.',
        },
      ],
      journalNotes: 'Queda de energia forte. Dormi 9h mas acordei me sentindo pesado. Aprendendo a respeitar o ritmo do corpo.',
      medIntakeStatus: 'taken' as const,
    },
    {
      daysAgo: 6,
      moodScore: -2 as const,
      moodLabel: 'Desanimado / Triste',
      isMixedState: false,
      sleepHours: 9.5,
      sleepQuality: 'poor' as const,
      energyLevel: 1,
      anxietyLevel: 3,
      irritabilityLevel: 1,
      emotions: ['Triste', 'Vazio', 'Desanimado'],
      somaticSymptoms: ['Fadiga física', 'Nó na garganta'],
      triggers: ['Falta de motivação', 'Ruminação'],
      activities: ['Repouso'],
      impulsiveBehaviors: [
        {
          id: 'imp-4',
          type: 'Scrolling excessivo / Telas',
          intensity: 4,
          resisted: 'yielded_fully' as const,
          trigger: 'Dificuldade de começar o dia',
          reflection: 'Fiquei horas no celular sem ânimo para levantar.',
        },
      ],
      journalNotes: 'Dia de energia mais baixa. Mantive minha hidratação, descansei e procurei não me cobrar em excesso.',
      customTags: ['#pausa', '#autocuidado', '#recuperacao'],
      medIntakeStatus: 'taken' as const,
    },
    {
      daysAgo: 5,
      moodScore: -1 as const,
      moodLabel: 'Levemente Desanimado',
      isMixedState: false,
      sleepHours: 8.5,
      sleepQuality: 'fair' as const,
      energyLevel: 2,
      anxietyLevel: 2,
      irritabilityLevel: 1,
      emotions: ['Melhorando', 'Esperançoso'],
      somaticSymptoms: ['Lentidão leve'],
      triggers: [],
      activities: ['Contato com familiar', 'Pequena caminhada ao sol'],
      impulsiveBehaviors: [],
      protectiveFactors: ['Conversar com alguém de confiança', 'Banho relaxante / autocuidado'],
      whatHelpedNotes: 'A ligação carinhosa da minha mãe me acolheu e trouxe alívio.',
      journalNotes: 'Falei com a família. Consegui caminhar 15 minutos ao ar livre. Pequena melhora percebida.',
      medIntakeStatus: 'taken' as const,
    },
    {
      daysAgo: 4,
      moodScore: 0 as const,
      moodLabel: 'Equilibrado / Neutro',
      isMixedState: false,
      sleepHours: 7.5,
      sleepQuality: 'good' as const,
      energyLevel: 3,
      anxietyLevel: 2,
      irritabilityLevel: 1,
      emotions: ['Estável', 'Aliviado', 'Calmo'],
      somaticSymptoms: [],
      triggers: ['Retomada da rotina básica'],
      activities: ['Trabalho em ritmo moderado', 'Alimentação saudável'],
      impulsiveBehaviors: [],
      journalNotes: 'Voltei ao meu ritmo normal. Dormi em quarto escuro e silencioso. Sem impulsos hoje.',
      medIntakeStatus: 'taken' as const,
    },
    {
      daysAgo: 3,
      moodScore: 0 as const,
      moodLabel: 'Equilibrado / Neutro',
      isMixedState: false,
      sleepHours: 7.5,
      sleepQuality: 'good' as const,
      energyLevel: 3,
      anxietyLevel: 1,
      irritabilityLevel: 1,
      emotions: ['Focado', 'Tranquilo'],
      somaticSymptoms: [],
      triggers: [],
      activities: ['Trabalho', 'Corrida', 'Leitura'],
      physicalActivities: [
        {
          id: 'w-seed-4',
          type: 'Corrida',
          durationMinutes: 35,
          intensity: 'vigorous' as const,
          postWorkoutFeeling: 'Sensação de dever cumprido',
        },
      ],
      impulsiveBehaviors: [],
      protectiveFactors: ['Praticar atividade física', 'Lembrar das minhas prioridades'],
      whatHelpedNotes: 'O treino de corrida matinal liberou a tensão acumulada e me deixou focado e centrado o dia todo.',
      journalNotes: 'Corrida no parque pela manhã ajudou muito na clareza mental. Concentração boa no trabalho.',
      medIntakeStatus: 'taken' as const,
    },
    {
      daysAgo: 2,
      moodScore: 0 as const,
      moodLabel: 'Equilibrado / Neutro',
      isMixedState: false,
      sleepHours: 8.0,
      sleepQuality: 'restorative' as const,
      energyLevel: 3,
      anxietyLevel: 1,
      irritabilityLevel: 1,
      emotions: ['Agradecido', 'Conectado', 'Presente'],
      somaticSymptoms: [],
      triggers: [],
      activities: ['Tempo com parceiro(a)', 'Respiração consciente'],
      impulsiveBehaviors: [],
      protectiveFactors: ['Pausa e respiração consciente', 'Contato com pet / animal'],
      whatHelpedNotes: 'Ficar perto do meu pet e respirar fundo me deu serenidade imediata.',
      journalNotes: 'Noite de sono excelente e reparadora. Me sinto centrado e calmo.',
      medIntakeStatus: 'taken' as const,
    },
    {
      daysAgo: 1,
      moodScore: 0 as const,
      moodLabel: 'Equilibrado / Neutro',
      isMixedState: false,
      sleepHours: 7.0,
      sleepQuality: 'good' as const,
      energyLevel: 3,
      anxietyLevel: 2,
      irritabilityLevel: 1,
      emotions: ['Tranquilo', 'Consciente'],
      somaticSymptoms: [],
      triggers: ['Tarefas a entregar'],
      activities: ['Organização da casa', 'Trabalho focado'],
      impulsiveBehaviors: [],
      journalNotes: 'Organizei as coisas com calma para evitar pressa desnecessária.',
      medIntakeStatus: 'taken' as const,
    },
    {
      daysAgo: 0,
      moodScore: 0 as const,
      moodLabel: 'Equilibrado / Neutro',
      isMixedState: false,
      sleepHours: 7.5,
      sleepQuality: 'good' as const,
      energyLevel: 3,
      anxietyLevel: 1,
      irritabilityLevel: 1,
      emotions: ['Centrado', 'Esperançoso', 'Tranquilo'],
      somaticSymptoms: [],
      triggers: ['Rotina fluida'],
      activities: ['Registro diário', 'Musculação', 'Trabalho'],
      physicalActivities: [
        {
          id: 'w-seed-5',
          type: 'Musculação',
          durationMinutes: 45,
          intensity: 'moderate' as const,
          postWorkoutFeeling: 'Mais disposto / energizado',
        },
      ],
      impulsiveBehaviors: [],
      protectiveFactors: ['Praticar atividade física', 'Pausa e respiração consciente'],
      whatHelpedNotes: 'Fazer musculação no meio do dia me tirou da inércia e restaurou a atenção.',
      journalNotes: 'Acompanhar o diário me ajuda a perceber o quanto minhas horas de sono e o treino influenciam minha tranquilidade!',
      medIntakeStatus: 'taken' as const,
    },
  ];

  scenarios.forEach((sc, index) => {
    const d = new Date(today);
    d.setDate(d.getDate() - sc.daysAgo);
    const dateStr = localDate(d);

    const medIntakes = INITIAL_MEDICATIONS.map((med) => ({
      medicationId: med.id,
      medicationName: med.name,
      status: sc.medIntakeStatus,
      sideEffects: [],
    }));

    entries.push({
      id: `entry-seed-${index + 1}`,
      date: dateStr,
      time: '21:30',
      isDemo: true, moodScale: 'legacy',
      moodScore: sc.moodScore,
      moodLabel: sc.moodLabel,
      isMixedState: sc.isMixedState,
      energyLevel: sc.energyLevel,
      anxietyLevel: sc.anxietyLevel,
      irritabilityLevel: sc.irritabilityLevel,
      mentalClarityLevel: null,
      hyperfocusPresent: null,
      hyperfocusNotes: null,
      unmetIntentionNotes: null,
      sleepHours: sc.sleepHours,
      sleepQuality: sc.sleepQuality,
      sleepLatencyMinutes: sc.sleepHours < 5 ? 75 : 20,
      emotions: sc.emotions,
      somaticSymptoms: sc.somaticSymptoms,
      triggers: sc.triggers,
      customTags: (sc as any).customTags || [],
      activities: sc.activities,
      physicalActivities: (sc as any).physicalActivities || [],
      impulsiveBehaviors: sc.impulsiveBehaviors,
      medicationIntakes: medIntakes,
      protectiveFactors: (sc as any).protectiveFactors || [],
      whatHelpedNotes: (sc as any).whatHelpedNotes || undefined,
      journalNotes: sc.journalNotes,
      createdAt: d.getTime(),
    });
  });

  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Normalize missing legacy fields without rewriting the user's notes or medication names.
function sanitizeEntry(entry: AfetivoEntry): AfetivoEntry {
  // Recognize only unchanged historical demo fixtures, never personal notes or unknown IDs.
  if (entry.isDemo === undefined && /^entry-seed-\d+$/.test(entry.id)) {
    const fixture = generateInitialSeedEntries().find(e => e.id === entry.id);
    const ignored = new Set([
      'date',
      'createdAt',
      'isDemo',
      'moodScale',
      // Estes campos não existiam nas demonstrações legadas.
      'mentalClarityLevel',
      'hyperfocusPresent',
      'hyperfocusNotes',
      'unmetIntentionNotes',
    ]);
    if (fixture && Object.keys(fixture).filter(key => !ignored.has(key)).every(key =>
      JSON.stringify(entry[key as keyof AfetivoEntry]) === JSON.stringify(fixture[key as keyof AfetivoEntry]))) {
      return validateEntries([{ ...entry, isDemo: true }])[0];
    }
  }
  return validateEntries([entry])[0];
}

function sanitizeMedication(med: Medication): Medication {
  return validateMedications([med])[0];
}

// Multi-key writes must either complete or preserve the previous backup.
function writeData(values: Record<string, string | null>): void {
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, localStorage.getItem(key)]));
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
  } catch (error) {
    for (const [key, value] of Object.entries(previous)) {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch { /* Keep the original storage error. */ }
    }
    throw error;
  }
  dataChanged();
}

export function loadEntries(): AfetivoEntry[] {
  try {
    let raw = localStorage.getItem(ENTRIES_STORAGE_KEY);
    if (!raw) {
      // Check legacy key for migration
      const legacyRaw = localStorage.getItem(OLD_ENTRIES_STORAGE_KEY);
      if (legacyRaw) {
        try {
          const legacyParsed = JSON.parse(legacyRaw);
          if (Array.isArray(legacyParsed)) {
            const sanitized = legacyParsed.map(sanitizeEntry);
            localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(sanitized));
            localStorage.removeItem(OLD_ENTRIES_STORAGE_KEY);
            return sanitized;
          }
        } catch {
          // fallback to seed
        }
      }

      const seeded: AfetivoEntry[] = [];
      localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeEntry);
  } catch (err) {
    console.error('Error loading entries from localStorage', err);
    return [];
  }
}

export function saveEntries(entries: AfetivoEntry[]): void {
  localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(validateEntries(entries)));
  dataChanged();
}

export function loadMedications(): Medication[] {
  try {
    let raw = localStorage.getItem(MEDICATIONS_STORAGE_KEY);
    if (!raw) {
      const legacyRaw = localStorage.getItem(OLD_MEDICATIONS_STORAGE_KEY);
      if (legacyRaw) {
        try {
          const legacyParsed = JSON.parse(legacyRaw);
          if (Array.isArray(legacyParsed)) {
            const sanitized = legacyParsed.map(sanitizeMedication);
            localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(sanitized));
            localStorage.removeItem(OLD_MEDICATIONS_STORAGE_KEY);
            return sanitized;
          }
        } catch {
          // fallback
        }
      }

      localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeMedication);
  } catch (err) {
    console.error('Error loading medications', err);
    return [];
  }
}

export function saveMedications(meds: Medication[]): void {
  localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(validateMedications(meds)));
  dataChanged();
}

export function loadUserProfile(): UserProfile {
  try {
    let raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) {
      const legacyRaw = localStorage.getItem(OLD_PATIENT_PROFILE_KEY);
      if (legacyRaw) {
        try {
          const legacyParsed = JSON.parse(legacyRaw);
          const migratedProfile: UserProfile = {
            name: legacyParsed.name || 'Guilherme',
            notes: 'Acompanhamento pessoal de humor, sono, hábitos e autorregulação.',
            notificationsEnabled: !!legacyParsed.notificationsEnabled,
          };
          localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(migratedProfile));
          localStorage.removeItem(OLD_PATIENT_PROFILE_KEY);
          return migratedProfile;
        } catch {
          // fallback
        }
      }

      const defaultProfile: UserProfile = {
        name: 'Guilherme',
        notes: 'Acompanhamento pessoal de humor, sono, hábitos e regulação emocional.',
        notificationsEnabled: false,
      };
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(defaultProfile));
      return defaultProfile;
    }
    return validateProfile(JSON.parse(raw));
  } catch {
    return {
      name: 'Guilherme',
      notificationsEnabled: false,
    };
  }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(validateProfile(profile)));
  dataChanged();
}

// Backwards compatibility functions
export const loadPatientProfile = loadUserProfile;
export const savePatientProfile = saveUserProfile;

export function resetAllDataToDemo(): void {
  writeData({
    [ENTRIES_STORAGE_KEY]: JSON.stringify(generateInitialSeedEntries()),
    [MEDICATIONS_STORAGE_KEY]: JSON.stringify(INITIAL_MEDICATIONS),
    [OLD_ENTRIES_STORAGE_KEY]: null, [OLD_MEDICATIONS_STORAGE_KEY]: null,
    [ENTRY_DRAFT_STORAGE_KEY]: null,
  });
}

export function clearAllUserData(): void {
  // Empty arrays distinguish an intentionally empty diary from a first visit.
  writeData({
    [ENTRIES_STORAGE_KEY]: '[]', [MEDICATIONS_STORAGE_KEY]: '[]',
    [OLD_ENTRIES_STORAGE_KEY]: null, [OLD_MEDICATIONS_STORAGE_KEY]: null,
    [USER_PROFILE_KEY]: null, [OLD_PATIENT_PROFILE_KEY]: null,
    [ENTRY_DRAFT_STORAGE_KEY]: null,
  });
}

export interface BackupPayload {
  version: string;
  system: string;
  exportedAt: string;
  totalEntries: number;
  totalWorkouts: number;
  profile: UserProfile;
  entries: AfetivoEntry[];
  medications: Medication[];
}

export function exportDataAsJSON(): string {
  const entries = loadEntries();
  const medications = loadMedications();
  const profile = loadUserProfile();

  let totalWorkouts = 0;
  entries.forEach((e) => {
    if (e.physicalActivities) totalWorkouts += e.physicalActivities.length;
  });

  const payload: BackupPayload = {
    version: '3.0',
    system: 'Sistema Afetivo - Acompanhamento de Humor, Hábitos & Regulação Emocional',
    exportedAt: new Date().toISOString(),
    totalEntries: entries.length,
    totalWorkouts,
    profile,
    entries,
    medications,
  };
  return JSON.stringify(payload, null, 2);
}

export function exportDataAsCSV(): string {
  const entries = loadEntries();
  const headers = [
    'Data',
    'Horario',
    'Humor_Score',
    'Humor_Rotulo',
    'Estado_Misto_Agitacao_Desanimo',
    'Horas_Sono',
    'Qualidade_Sono',
    'Latencia_Sono_Minutos',
    'Nivel_Energia_1a5',
    'Nivel_Ansiedade_0a5',
    'Nivel_Irritabilidade_0a5',
    'Atividades_Fisicas',
    'Minutos_Totais_Treino',
    'Emocoes',
    'Sintomas_Corpo',
    'Gatilhos',
    'Impulsos_Monitorados',
    'Protecoes_Ancoras_O_Que_Ajudou',
    'Notas_O_Que_Ajudou',
    'Tags_Personalizadas',
    'Rotina_Medicacoes_Suplementos',
    'Notas_Diario',
    'Notas_Gratidao', 'Escala_Humor', 'Tipo_Registro', 'Ativacao_1a5', 'Contextos', 'Proximo_Passo', 'Estrategia_Avaliacao', 'Secoes_Respondidas', 'Demonstracao', 'Clareza_Mental_1a5', 'Hiperfoco_Percebido', 'Hiperfoco_Descricao', 'Pretendia_Mas_Nao_Consegui',
  ];

  const escapeCsv = (str: string | number | boolean | null | undefined) => {
    if (str === undefined || str === null) return '""';
    const value = typeof str === 'string' && /^[\s]*[=+@-]/.test(str) ? `'${str}` : String(str);
    const clean = value.replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = entries.map((e) => {
    const workoutsStr = (e.physicalActivities || [])
      .map((w) => `${w.type} (${w.durationMinutes == null ? 'duração não informada' : `${w.durationMinutes}min`}, ${w.intensity ?? 'intensidade não informada'}${w.postWorkoutFeeling ? `, pós: ${w.postWorkoutFeeling}` : ''})`)
      .join('; ');

    const totalMinutes = (e.physicalActivities || []).reduce(
      (sum, w) => sum + (Number(w.durationMinutes) || 0),
      0
    );

    const impulsesStr = (e.impulsiveBehaviors || [])
      .map((i) => {
        const resistedLabel = impulseLabel(i);
        return `${i.type} [${resistedLabel}${i.reflection ? ` - ${i.reflection}` : ''}]`;
      })
      .join('; ');

    const protectionsStr = (e.protectiveFactors || []).join('; ');

    const medIntakesStr = (e.medicationIntakes || [])
      .map((m) => {
        const statusMap: Record<string, string> = {
          taken: 'Tomado',
          skipped: 'Não tomado',
          delayed: 'Atrasado',
          extra_dose: 'Dose extra',
        };
        const st = statusMap[m.status] || m.status;
        return `${m.medicationName}: ${st}${m.timeTaken ? ` às ${m.timeTaken}` : ''}`;
      })
      .join('; ');

    const tagsStr = (e.customTags || []).join(' ');

    return [
      escapeCsv(e.date),
      escapeCsv(e.time),
      escapeCsv(e.moodScore),
      escapeCsv(e.moodLabel),
      escapeCsv(e.isMixedState == null ? '' : e.isMixedState ? 'Sim' : 'Nao'),
      escapeCsv(e.sleepHours),
      escapeCsv(e.sleepQuality),
      escapeCsv(e.sleepLatencyMinutes ?? ''),
      escapeCsv(e.energyLevel),
      escapeCsv(e.anxietyLevel),
      escapeCsv(e.irritabilityLevel),
      escapeCsv(workoutsStr),
      escapeCsv(e.physicalActivities?.some(w => w.durationMinutes == null) ? null : e.physicalActivities?.length ? totalMinutes : e.observedSections?.includes('activities') ? 0 : ''),
      escapeCsv(e.emotions?.join(', ')),
      escapeCsv(e.somaticSymptoms?.join(', ')),
      escapeCsv(e.triggers?.join(', ')),
      escapeCsv(impulsesStr),
      escapeCsv(protectionsStr),
      escapeCsv(e.whatHelpedNotes),
      escapeCsv(tagsStr),
      escapeCsv(medIntakesStr),
      escapeCsv(e.journalNotes),
      escapeCsv(e.gratitudeNotes), escapeCsv(e.moodScale ?? 'legacy'), escapeCsv(e.recordKind ?? 'legacy'), escapeCsv(e.activationLevel), escapeCsv(e.contexts?.join('; ')), escapeCsv(e.nextStep), escapeCsv(e.strategyEffect), escapeCsv(e.observedSections?.join('; ')), escapeCsv(Boolean(e.isDemo)), escapeCsv(e.mentalClarityLevel), escapeCsv(e.hyperfocusPresent == null ? null : e.hyperfocusPresent ? 'Sim' : 'Não'), escapeCsv(e.hyperfocusNotes), escapeCsv(e.unmetIntentionNotes),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function importDataFromJSON(jsonString: string): {
  success: boolean;
  entriesCount?: number;
  medsCount?: number;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonString);
    let entriesToSave: AfetivoEntry[] | null = null;
    let medsToSave: Medication[] | null = null;
    let profileToSave: UserProfile | null = null;

    if (Array.isArray(data)) {
      entriesToSave = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.entries)) {
        entriesToSave = data.entries;
      }
      if ('medications' in data && !Array.isArray(data.medications)) throw new Error('Lista de medicamentos inválida.');
      if (Array.isArray(data.medications)) {
        medsToSave = data.medications;
      }
      if (data.profile) {
        profileToSave = data.profile;
      }
    }

    if (!entriesToSave || !Array.isArray(entriesToSave)) {
      return { success: false, error: 'Arquivo JSON inválido. Não foram encontrados registros de humor.' };
    }

    // Validate every section before touching any existing data.
    const values: Record<string, string | null> = {
      [ENTRIES_STORAGE_KEY]: JSON.stringify(validateEntries(entriesToSave)),
      [OLD_ENTRIES_STORAGE_KEY]: null,
    };
    if (medsToSave) values[MEDICATIONS_STORAGE_KEY] = JSON.stringify(validateMedications(medsToSave));
    if (profileToSave) values[USER_PROFILE_KEY] = JSON.stringify(validateProfile(profileToSave));
    writeData(values);

    return {
      success: true,
      entriesCount: entriesToSave.length,
      medsCount: medsToSave ? medsToSave.length : 0,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao processar arquivo.' };
  }
}
