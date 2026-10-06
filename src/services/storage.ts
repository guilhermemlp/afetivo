import { AfetivoEntry, Medication } from '../types/mood';

const ENTRIES_STORAGE_KEY = 'afetivo_entries_v1';
const MEDICATIONS_STORAGE_KEY = 'afetivo_medications_v1';
const PATIENT_PROFILE_KEY = 'afetivo_patient_profile_v1';

export interface PatientProfile {
  name: string;
  notes?: string;
  notificationsEnabled: boolean;
}

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: 'Estabilizador / Medicação 1',
    category: 'mood_stabilizer',
    dosage: '300mg',
    frequency: 'daily_night',
    notes: 'Tomar à noite com água',
    active: true,
  },
  {
    id: 'med-2',
    name: 'Medicação para Sono / Rotina',
    category: 'sleep_aid',
    dosage: '50mg',
    frequency: 'daily_night',
    notes: 'Para ajudar a desacelerar e dormir melhor',
    active: true,
  },
  {
    id: 'med-3',
    name: 'Suplemento / Medicação Manhã',
    category: 'supplement',
    dosage: '100mg',
    frequency: 'daily_morning',
    notes: 'Tomar após café da manhã',
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
      journalNotes: 'Almocei com amigos. Dia leve, tomei as medicações no horário correto.',
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
      journalNotes: 'Dia de energia muito baixa. Tomei os remédios da rotina e tentei não me cobrar em excesso.',
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
    const dateStr = d.toISOString().split('T')[0];

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
      moodScore: sc.moodScore,
      moodLabel: sc.moodLabel,
      isMixedState: sc.isMixedState,
      energyLevel: sc.energyLevel,
      anxietyLevel: sc.anxietyLevel,
      irritabilityLevel: sc.irritabilityLevel,
      sleepHours: sc.sleepHours,
      sleepQuality: sc.sleepQuality,
      sleepLatencyMinutes: sc.sleepHours < 5 ? 75 : 20,
      emotions: sc.emotions,
      somaticSymptoms: sc.somaticSymptoms,
      triggers: sc.triggers,
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

export function loadEntries(): AfetivoEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_STORAGE_KEY);
    if (!raw) {
      const seeded = generateInitialSeedEntries();
      localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Ensure backwards compatibility with older stored entries
    return parsed.map((entry) => ({
      ...entry,
      physicalActivities: entry.physicalActivities || [],
      protectiveFactors: entry.protectiveFactors || [],
    }));
  } catch (err) {
    console.error('Error loading entries from localStorage', err);
    return [];
  }
}

export function saveEntries(entries: AfetivoEntry[]): void {
  try {
    localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Error saving entries to localStorage', err);
  }
}

export function loadMedications(): Medication[] {
  try {
    const raw = localStorage.getItem(MEDICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_MEDICATIONS));
      return INITIAL_MEDICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_MEDICATIONS;
  } catch (err) {
    console.error('Error loading medications', err);
    return INITIAL_MEDICATIONS;
  }
}

export function saveMedications(meds: Medication[]): void {
  try {
    localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(meds));
  } catch (err) {
    console.error('Error saving medications', err);
  }
}

export function loadPatientProfile(): PatientProfile {
  try {
    const raw = localStorage.getItem(PATIENT_PROFILE_KEY);
    if (!raw) {
      const defaultProfile: PatientProfile = {
        name: 'Guilherme',
        notes: 'Acompanhamento pessoal de humor, sono, hábitos e regulação emocional.',
        notificationsEnabled: false,
      };
      localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(defaultProfile));
      return defaultProfile;
    }
    return JSON.parse(raw);
  } catch {
    return {
      name: 'Usuário',
      notificationsEnabled: false,
    };
  }
}

export function savePatientProfile(profile: PatientProfile): void {
  try {
    localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving profile', err);
  }
}

export function resetAllDataToDemo(): void {
  const seeded = generateInitialSeedEntries();
  localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(seeded));
  localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_MEDICATIONS));
}

export function clearAllUserData(): void {
  localStorage.removeItem(ENTRIES_STORAGE_KEY);
  localStorage.removeItem(MEDICATIONS_STORAGE_KEY);
  localStorage.removeItem(PATIENT_PROFILE_KEY);
}

export interface BackupPayload {
  version: string;
  exportedAt: string;
  entries: AfetivoEntry[];
  medications: Medication[];
  profile?: PatientProfile;
}

export function exportDataAsJSON(): string {
  const payload: BackupPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    entries: loadEntries(),
    medications: loadMedications(),
    profile: loadPatientProfile(),
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
    'Estado_Misto',
    'Horas_Sono',
    'Qualidade_Sono',
    'Nivel_Energia',
    'Nivel_Ansiedade',
    'Nivel_Irritabilidade',
    'Atividades_Fisicas',
    'Emocoes',
    'Sintomas_Somaticos',
    'Gatilhos',
    'Impulsos_Registrados',
    'Protecoes_O_Que_Ajudou',
    'Notas_Diario',
    'Notas_Gratidao',
  ];

  const rows = entries.map((e) => {
    const workoutsStr = (e.physicalActivities || [])
      .map((w) => `${w.type} (${w.durationMinutes}min, ${w.intensity})`)
      .join('; ');
    const impulsesStr = (e.impulsiveBehaviors || [])
      .map((i) => `${i.type} [Resistido: ${i.resisted}]`)
      .join('; ');
    const protectionsStr = [
      ...(e.protectiveFactors || []),
      e.whatHelpedNotes ? `Nota: ${e.whatHelpedNotes}` : '',
    ]
      .filter(Boolean)
      .join('; ');

    const escapeCsv = (str: string | number | boolean | undefined) => {
      if (str === undefined || str === null) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    return [
      escapeCsv(e.date),
      escapeCsv(e.time),
      escapeCsv(e.moodScore),
      escapeCsv(e.moodLabel),
      escapeCsv(e.isMixedState ? 'Sim' : 'Nao'),
      escapeCsv(e.sleepHours),
      escapeCsv(e.sleepQuality),
      escapeCsv(e.energyLevel),
      escapeCsv(e.anxietyLevel),
      escapeCsv(e.irritabilityLevel),
      escapeCsv(workoutsStr),
      escapeCsv(e.emotions?.join(', ')),
      escapeCsv(e.somaticSymptoms?.join(', ')),
      escapeCsv(e.triggers?.join(', ')),
      escapeCsv(impulsesStr),
      escapeCsv(protectionsStr),
      escapeCsv(e.journalNotes),
      escapeCsv(e.gratitudeNotes),
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
    if (!data || !Array.isArray(data.entries)) {
      return { success: false, error: 'Arquivo JSON inválido. Estrutura não reconhecida.' };
    }
    saveEntries(data.entries);
    if (Array.isArray(data.medications)) {
      saveMedications(data.medications);
    }
    if (data.profile) {
      savePatientProfile(data.profile);
    }
    return {
      success: true,
      entriesCount: data.entries.length,
      medsCount: data.medications ? data.medications.length : 0,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao processar arquivo.' };
  }
}
