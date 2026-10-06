import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Shield,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Dumbbell,
  Calendar,
  Heart,
} from 'lucide-react';
import {
  exportDataAsJSON,
  exportDataAsCSV,
  importDataFromJSON,
  loadEntries,
  loadMedications,
  resetAllDataToDemo,
} from '../services/storage';
import { localDate } from '../services/dates';

import { FolderBackupPanel } from './FolderBackupPanel';
import { useConfirmation } from './ConfirmationProvider';

interface Props {
  onClose: () => void;
  onDataRestored: () => void;
}

export const DataBackupModal: React.FC<Props> = ({
  onClose,
  onDataRestored,
}) => {
  const confirm = useConfirmation();
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live stats from storage
  const [stats, setStats] = useState({
    entriesCount: 0,
    workoutCount: 0,
    protectionsCount: 0,
    medsCount: 0,
  });

  const refreshStats = () => {
    const entries = loadEntries();
    const meds = loadMedications();
    let workouts = 0;
    let protections = 0;
    entries.forEach((e) => {
      workouts += e.physicalActivities?.length || 0;
      protections += e.protectiveFactors?.length || 0;
    });
    setStats({
      entriesCount: entries.length,
      workoutCount: workouts,
      protectionsCount: protections,
      medsCount: meds.length,
    });
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleDownloadJSON = () => {
    const jsonStr = exportDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afetivo_backup_v3_${localDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csvStr = exportDataAsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afetivo_dados_completos_${localDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (
        !(await confirm(
          'Restaurar este backup substituirá os registros atuais. Deseja continuar?',
        ))
      )
        return;
      const result = importDataFromJSON(content);
      if (result.success) {
        setImportStatus({
          success: true,
          message: `Backup restaurado com sucesso! ${result.entriesCount} registros e ${result.medsCount} rotinas carregados.`,
        });
        refreshStats();
        onDataRestored();
      } else {
        setImportStatus({
          success: false,
          message: result.error || 'Erro ao importar arquivo.',
        });
      }
    };
    reader.onerror = () =>
      setImportStatus({
        success: false,
        message: 'Não foi possível ler o arquivo.',
      });
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToCurrentDataset = async () => {
    if (
      await confirm(
        'Deseja limpar registros antigos e carregar a base de demonstração atualizada (com treinos, tags livres e âncoras protetivas)?',
      )
    ) {
      try {
        resetAllDataToDemo();
      } catch {
        setImportStatus({
          success: false,
          message: 'Não foi possível salvar a demonstração no navegador.',
        });
        return;
      }
      refreshStats();
      onDataRestored();
      setImportStatus({
        success: true,
        message:
          'Demonstração restaurada. Os exemplos fictícios substituíram os dados locais.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-lg w-full p-6 space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Backup, Exportação & Privacidade
              </h3>
              <p className="text-xs text-stone-500">
                Dados e análises permanecem neste navegador. Backups só vão
                para os destinos escolhidos por você.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar backup"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Summary Card */}
        <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 text-xs">
          <div className="flex items-center justify-between font-semibold text-teal-900 dark:text-teal-200 mb-2">
            <span>Visão dos Seus Dados Atuais</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300">
              Versão 3.0
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-teal-100 dark:border-teal-900/40">
              <span className="text-[10px] text-stone-500 block">
                Registros no Backup
              </span>
              <span className="text-sm font-bold font-mono text-teal-800 dark:text-teal-300">
                {stats.entriesCount}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-teal-100 dark:border-teal-900/40">
              <span className="text-[10px] text-stone-500 block">
                Treinos Físicos
              </span>
              <span className="text-sm font-bold font-mono text-teal-800 dark:text-teal-300">
                {stats.workoutCount}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-teal-100 dark:border-teal-900/40">
              <span className="text-[10px] text-stone-500 block">
                Âncoras de Apoio
              </span>
              <span className="text-sm font-bold font-mono text-teal-800 dark:text-teal-300">
                {stats.protectionsCount}
              </span>
            </div>
          </div>
        </div>

        <FolderBackupPanel
          onDataRestored={() => {
            refreshStats();
            onDataRestored();
          }}
        />

        {/* Export Options */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Exportar Dados do Sistema Afetivo
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadJSON}
              className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-teal-500 dark:hover:border-teal-500 bg-white dark:bg-stone-800/60 flex flex-col items-start text-left transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-700 dark:text-teal-300 mb-2">
                <Download className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                Backup JSON Completo (v3.0)
              </span>
              <span className="text-[11px] text-stone-500 mt-0.5">
                Salva todos os registros, treinos, tags e âncoras para
                restauração.
              </span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-teal-500 dark:hover:border-teal-500 bg-white dark:bg-stone-800/60 flex flex-col items-start text-left transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300 mb-2">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                Planilha CSV Detalhada
              </span>
              <span className="text-[11px] text-stone-500 mt-0.5">
                31 colunas completas: humor, ativação, contexto, sono e rotina.
              </span>
            </button>
          </div>
        </div>

        {/* Import / Restore Section */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Restaurar Arquivo de Backup
          </label>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-teal-500 dark:hover:border-teal-500 bg-stone-50/50 dark:bg-stone-800/20 text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Selecionar arquivo .JSON para restaurar</span>
          </button>

          {importStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {importStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>

        {/* Data Refresh & Purge Option */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
          <button
            onClick={handleResetToCurrentDataset}
            className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1.5 cursor-pointer text-[11px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar Demonstração</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
