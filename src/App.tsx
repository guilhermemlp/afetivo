/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AfetivoEntry, Medication } from './types/mood';
import {
  loadEntries,
  saveEntries,
  loadMedications,
  saveMedications,
  resetAllDataToDemo,
  clearAllUserData,
  loadUserProfile,
} from './services/storage';
import { AfetivogramaChart } from './components/AfetivogramaChart';
import { QuickMoodLogger } from './components/QuickMoodLogger';
import { PatternAnalyzer } from './components/PatternAnalyzer';
import { MedicationManager } from './components/MedicationManager';
import { JournalFeed } from './components/JournalFeed';
import { ClinicalReportModal } from './components/ClinicalReportModal';
import { PlanningGuideModal } from './components/PlanningGuideModal';
import { DataBackupModal } from './components/DataBackupModal';
import { useConfirmation } from './components/ConfirmationProvider';
import {
  BookOpen,
  Brain,
  Plus,
  RotateCcw,
  FileText,
  HelpCircle,
  Download,
  Shield,
} from 'lucide-react';

type NavTab = 'dashboard' | 'feed' | 'patterns' | 'medications';

export default function App() {
  const confirm = useConfirmation();
  const [storageError, setStorageError] = useState<string | null>(null);
  const persist = (operation: () => void) => {
    try {
      operation();
      setStorageError(null);
      return true;
    } catch {
      setStorageError(
        'Não foi possível salvar no navegador. Verifique o espaço disponível e as permissões de armazenamento.',
      );
      return false;
    }
  };
  const [entries, setEntries] = useState<AfetivoEntry[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [userName, setUserName] = useState('Guilherme');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [timeFrameDays, setTimeFrameDays] = useState<number>(14);

  // Modals
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AfetivoEntry | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadedEntries = loadEntries();
    const loadedMeds = loadMedications();
    setEntries(loadedEntries);
    setMedications(loadedMeds);
    setUserName(loadUserProfile().name);
  }, []);

  // Handlers
  const handleSaveEntry = async (newEntry: AfetivoEntry) => {
    const updated = entries.filter((entry) => entry.id !== newEntry.id);
    updated.push(newEntry);
    updated.sort(
      (a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
    );

    if (!persist(() => saveEntries(updated)))
      throw new Error(
        'Não foi possível salvar no navegador. Verifique o espaço disponível e as permissões de armazenamento.',
      );
    setEntries(updated);
    return true;
  };

  const handleDeleteEntry = async (id: string) => {
    if (await confirm('Deseja realmente excluir este registro?')) {
      const updated = entries.filter((e) => e.id !== id);
      if (persist(() => saveEntries(updated))) setEntries(updated);
    }
  };

  const handleUpdateMedications = (newMeds: Medication[]) => {
    if (!persist(() => saveMedications(newMeds))) return false;
    setMedications(newMeds);
    return true;
  };

  const handleResetToDemo = async () => {
    if (
      await confirm(
        'Deseja redefinir os dados para o conjunto demonstrativo de 14 dias?',
      )
    ) {
      if (!persist(resetAllDataToDemo)) return;
      setEntries(loadEntries());
      setMedications(loadMedications());
    }
  };

  const handleClearAll = async () => {
    if (
      await confirm(
        'Deseja apagar todos os registros e iniciar seu diário do zero?',
      )
    ) {
      if (!persist(clearAllUserData)) return;
      setEntries([]);
      setMedications([]);
      setUserName('Guilherme');
    }
  };

  const openNewEntry = () => {
    setEditingEntry(null);
    setIsLoggerOpen(true);
  };

  const realEntries = entries.filter((e) => !e.isDemo);
  const totalDays = new Set(realEntries.map((e) => e.date)).size;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans antialiased">
      {entries.some((e) => e.isDemo) && (
        <p
          role="status"
          className="bg-amber-50 text-amber-900 px-4 py-3 text-sm"
        >
          Demonstração: os exemplos são fictícios e ficam fora das análises e
          dos relatórios pessoais.
        </p>
      )}
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
            className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2"
          >
            <span>Afetivo</span>
          </a>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-600 dark:text-stone-400">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-stone-900 dark:text-stone-100 font-semibold'
                  : ''
              }`}
            >
              Mapa do Humor
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer ${
                activeTab === 'feed'
                  ? 'text-stone-900 dark:text-stone-100 font-semibold'
                  : ''
              }`}
            >
              Diário & Histórico
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer ${
                activeTab === 'patterns'
                  ? 'text-stone-900 dark:text-stone-100 font-semibold'
                  : ''
              }`}
            >
              Análise de Padrões
            </button>
            <button
              onClick={() => setActiveTab('medications')}
              className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer ${
                activeTab === 'medications'
                  ? 'text-stone-900 dark:text-stone-100 font-semibold'
                  : ''
              }`}
            >
              Medicações & Rotina
            </button>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Guia de Padrões</span>
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsBackupOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer bg-white dark:bg-stone-900"
              title="Backup JSON, Exportar CSV e Privacidade dos Dados"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Backup & Exportar</span>
            </button>

            <button
              onClick={openNewEntry}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-teal-800 hover:bg-teal-900 dark:bg-teal-700 dark:hover:bg-teal-600 rounded-lg shadow-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Registro</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation scroller */}
        <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-stone-100 dark:border-stone-800/80 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Mapa do Humor
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Diário
          </button>
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'patterns'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Padrões
          </button>
          <button
            onClick={() => setActiveTab('medications')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'medications'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Medicações
          </button>
          <button
            onClick={() => setIsGuideOpen(true)}
            className="px-2.5 py-1 rounded-md text-teal-700 dark:text-teal-400 whitespace-nowrap cursor-pointer"
          >
            Guia
          </button>
        </div>
      </header>

      {storageError && (
        <p
          role="alert"
          className="mx-auto w-full max-w-6xl px-6 py-3 text-sm text-rose-700"
        >
          {storageError}
        </p>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* VIEW 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Header intro & Period filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span>Monitoramento Pessoal</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {realEntries.length} registros em {totalDays} dias
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mt-0.5">
                  Painel de Humor, Emoções & Hábitos
                </h1>
              </div>

              {/* Segmented Time Frame Selector */}
              <div className="flex items-center gap-1 p-1 bg-stone-200/60 dark:bg-stone-800 rounded-xl text-xs self-start sm:self-auto">
                {[
                  { days: 7, label: '7 Dias' },
                  { days: 14, label: '14 Dias' },
                  { days: 30, label: '30 Dias' },
                  { days: 0, label: 'Todos' },
                ].map((tf) => (
                  <button
                    key={tf.days}
                    onClick={() => setTimeFrameDays(tf.days)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      timeFrameDays === tf.days
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {!realEntries.length && (
              <section className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5 dark:border-teal-900 dark:bg-teal-950/40">
                <h2 className="font-semibold text-stone-900 dark:text-stone-100">
                  Nada registrado ainda.
                </h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  Quer fazer um check-in rápido? Só data e horário já bastam.
                </p>
                <button
                  onClick={openNewEntry}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white dark:bg-teal-700"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Fazer check-in rápido
                </button>
              </section>
            )}

            {/* The Visual Chart */}
            <AfetivogramaChart
              entries={entries}
              timeFrameDays={timeFrameDays}
              onSelectEntry={(entry) => {
                setEditingEntry(entry);
                setIsLoggerOpen(true);
              }}
            />

            {/* Bottom Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Pattern Intelligence CTA */}
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-400 font-semibold mb-1">
                    <Brain className="w-4 h-4" />
                    <span>Identificação de Padrões</span>
                  </div>
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                    Analisar Padrões de Humor & Sono
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Consulte os contextos relatados, as respostas disponíveis e
                    os detalhes que você escolheu guardar.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('patterns')}
                  className="mt-4 px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Ver Meus Registros</span>
                  <span>→</span>
                </button>
              </div>

              {/* Card 2: Report CTA */}
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-sky-700 dark:text-sky-400 font-semibold mb-1">
                    <FileText className="w-4 h-4" />
                    <span>Resumo Pessoal</span>
                  </div>
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                    Resumo dos Seus Registros
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Guarde um resumo de humor, ativação, sono e contexto, com os
                    limites das respostas disponíveis.
                  </p>
                </div>
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="mt-4 px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Gerar Resumo em Texto</span>
                  <span>→</span>
                </button>
              </div>

              {/* Card 3: Guide CTA */}
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Autoconhecimento</span>
                  </div>
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                    Como Analisar Suas Emoções
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Veja como registrar emoções e contexto, pular detalhes e
                    retomar quando quiser.
                  </p>
                </div>
                <button
                  onClick={() => setIsGuideOpen(true)}
                  className="mt-4 px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Abrir Guia de Hábitos</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: JOURNAL & FEED */}
        {activeTab === 'feed' && (
          <JournalFeed
            entries={entries}
            onNewEntry={openNewEntry}
            onEditEntry={(entry) => {
              setEditingEntry(entry);
              setIsLoggerOpen(true);
            }}
            onDeleteEntry={handleDeleteEntry}
          />
        )}

        {/* VIEW 3: PATTERNS */}
        {activeTab === 'patterns' && (
          <PatternAnalyzer
            entries={entries}
            onOpenReportModal={() => setIsReportOpen(true)}
          />
        )}

        {/* VIEW 4: MEDICATIONS */}
        {activeTab === 'medications' && (
          <MedicationManager
            medications={medications}
            entries={entries}
            onUpdateMedications={handleUpdateMedications}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-6 text-xs text-stone-500 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>Afetivo © 2026</span>
            <span aria-hidden="true">·</span>
            <span>Diário de Humor, Emoções & Contexto</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsBackupOpen(true)}
              className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              <span>Backup & Privacidade</span>
            </button>
            <button
              onClick={handleResetToDemo}
              className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Demonstração</span>
            </button>
            <button
              onClick={handleClearAll}
              className="text-rose-600/80 hover:text-rose-700 cursor-pointer"
            >
              Limpar Tudo
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isBackupOpen && (
        <DataBackupModal
          onClose={() => setIsBackupOpen(false)}
          onDataRestored={() => {
            setEntries(loadEntries());
            setMedications(loadMedications());
            setUserName(loadUserProfile().name);
          }}
        />
      )}

      {isLoggerOpen && (
        <QuickMoodLogger
          medications={medications}
          initialEntry={editingEntry}
          onSave={handleSaveEntry}
          onClose={() => {
            setIsLoggerOpen(false);
            setEditingEntry(null);
          }}
        />
      )}

      {isReportOpen && (
        <ClinicalReportModal
          entries={entries}
          medications={medications}
          userName={userName}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {isGuideOpen && (
        <PlanningGuideModal onClose={() => setIsGuideOpen(false)} />
      )}
    </div>
  );
}
