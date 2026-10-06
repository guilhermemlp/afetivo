import React, { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, Shield, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { exportDataAsJSON, exportDataAsCSV, importDataFromJSON } from '../services/storage';

interface Props {
  onClose: () => void;
  onDataRestored: () => void;
}

export const DataBackupModal: React.FC<Props> = ({ onClose, onDataRestored }) => {
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadJSON = () => {
    const jsonStr = exportDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afetivo_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csvStr = exportDataAsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afetivo_dados_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importDataFromJSON(content);
      if (result.success) {
        setImportStatus({
          success: true,
          message: `Backup restaurado com sucesso! ${result.entriesCount} registros e ${result.medsCount} medicações carregados.`,
        });
        onDataRestored();
      } else {
        setImportStatus({
          success: false,
          message: result.error || 'Erro ao importar arquivo.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Backup, Exportação & Privacidade
              </h3>
              <p className="text-xs text-stone-500">
                Seus dados pertencem a você. Exporte ou restaure a qualquer momento.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Note */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-700/60 text-xs text-stone-600 dark:text-stone-300 space-y-1.5">
          <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Armazenamento 100% Local (Privacidade Total)</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
            Todas as suas oscilações de humor, noites de sono, atividades físicas e impulsos ficam gravados apenas na memória deste navegador (localStorage). Para garantir que você não perca seu histórico caso limpe os dados do navegador, recomendamos baixar um backup periódico.
          </p>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Exportar Histórico Completo
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
                Backup JSON Completo
              </span>
              <span className="text-[11px] text-stone-500 mt-0.5">
                Ideal para restaurar ou transferir de dispositivo.
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
                Planilha CSV
              </span>
              <span className="text-[11px] text-stone-500 mt-0.5">
                Para abrir no Excel, Google Sheets ou análise de dados.
              </span>
            </button>
          </div>
        </div>

        {/* Import / Restore Section */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Restaurar Backup (JSON)
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
            <span>Selecionar arquivo .JSON de backup</span>
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

        <div className="flex justify-end pt-2">
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
