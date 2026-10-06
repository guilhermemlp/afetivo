import { useModalFocus } from '../hooks/useModalFocus';
import React, { useState, useEffect, useRef } from 'react';
import { AfetivoEntry, Medication } from '../types/mood';
import { X, Copy, Check, Printer, FileText, Download, Calendar } from 'lucide-react';

import { localDate } from '../services/dates';

interface Props {
  entries: AfetivoEntry[];
  medications: Medication[];
  patientName?: string;
  userName?: string;
  onClose: () => void;
}

import { buildDeterministicReport } from '../services/observations';
export { buildDeterministicReport } from '../services/observations';

export const ClinicalReportModal: React.FC<Props> = ({
  entries,
  medications,
  patientName,
  userName,
  onClose,
}) => {
  const modalRef = useModalFocus(onClose);
  const effectiveName = userName || patientName || 'Guilherme';
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [reportText, setReportText] = useState<string>(() =>
    buildDeterministicReport(entries, medications, effectiveName, 30)
  );
  const sourceBadge = 'Resumo local';
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCopied(false); setCopyError(null);
    setReportText(buildDeterministicReport(entries, medications, effectiveName, periodDays));
  }, [periodDays, entries, medications, effectiveName]);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const handleCopy = async () => {
    setCopied(false); setCopyError(null);
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError('O navegador bloqueou a cópia. Selecione o texto ou use Baixar Arquivo (.txt).');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFile = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_afetivo_${effectiveName.toLowerCase()}_${localDate()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="report-print-root fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div ref={modalRef as React.RefObject<HTMLDivElement>} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Relatório de acompanhamento" className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col my-auto print:border-none print:shadow-none print:max-h-full print:w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>Resumo dos seus registros</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  {sourceBadge}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                Relatório de Acompanhamento Emocional & Hábitos
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar relatório"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar (print:hidden) */}
        <div className="px-6 py-2.5 bg-stone-50 dark:bg-stone-800/40 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 print:hidden text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-500 font-medium mr-1">Período:</span>
            {[
              { days: 7, label: '7 Dias' },
              { days: 14, label: '14 Dias' },
              { days: 30, label: '30 Dias' },
              { days: 0, label: 'Todo o Histórico' },
            ].map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriodDays(p.days)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  periodDays === p.days
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/60 dark:border-stone-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-stone-400">
            {entries.length} registro(s) no total disponíveis
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 text-xs space-y-4 print:p-0">
          <div className="bg-stone-50 dark:bg-stone-800/50 p-5 sm:p-6 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-stone-800 dark:text-stone-200 print:bg-white print:border-none print:p-0 print:text-black">
            {reportText}
          </div>
        </div>

        {copyError && <p role="alert" className="px-6 py-2 text-sm text-rose-700 print:hidden">{copyError}</p>}

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-stone-400">
            Você pode guardar este resumo ou compartilhá-lo, se quiser.
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-medium border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors flex items-center gap-1.5 text-stone-700 dark:text-stone-300 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleDownloadFile}
              className="px-3.5 py-2 text-xs font-medium border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors flex items-center gap-1.5 text-stone-700 dark:text-stone-300 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Baixar Arquivo (.txt)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-medium text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Salvar PDF / Imprimir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
