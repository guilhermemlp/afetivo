import React, { useState } from 'react';
import { AfetivoEntry, Medication } from '../types/mood';
import { X, Copy, Check, Printer, FileText, RefreshCw } from 'lucide-react';

interface Props {
  entries: AfetivoEntry[];
  medications: Medication[];
  patientName: string;
  onClose: () => void;
}

export const ClinicalReportModal: React.FC<Props> = ({
  entries,
  medications,
  patientName,
  onClose,
}) => {
  const [reportText, setReportText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/clinical-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries,
          medications,
          patientName,
          periodDays: 30,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReportText(data.reportText || '');
      }
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col my-auto print:border-none print:shadow-none print:max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>Resumo Pessoal</span>
                <span aria-hidden="true">·</span>
                <span>Padrões de Humor, Hábitos & Sono</span>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                Relatório de Acompanhamento Emocional
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 flex-1 text-xs space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
              <span>Sintetizando histórico de padrões e sono...</span>
            </div>
          ) : (
            <div className="bg-stone-50 dark:bg-stone-800/40 p-5 rounded-xl border border-stone-200 dark:border-stone-700/80 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-stone-800 dark:text-stone-200 print:bg-white print:border-none print:p-0 print:text-black">
              {reportText}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between print:hidden">
          <div className="text-xs text-stone-400">
            Resumo factual para sua análise pessoal ou para levar a conversas
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-medium border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1.5 text-stone-700 dark:text-stone-300 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-medium text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
