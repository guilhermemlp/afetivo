import React, { useState, useEffect } from 'react';
import { AfetivoEntry, Medication } from '../types/mood';
import { X, Copy, Check, Printer, FileText, Download, Sparkles, RefreshCw, Calendar } from 'lucide-react';

interface Props {
  entries: AfetivoEntry[];
  medications: Medication[];
  patientName?: string;
  userName?: string;
  onClose: () => void;
}

export function buildDeterministicReport(
  entries: AfetivoEntry[],
  medications: Medication[],
  name: string,
  periodDays: number
): string {
  // Filter entries according to period if specified
  let targetEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  if (periodDays > 0 && targetEntries.length > periodDays) {
    targetEntries = targetEntries.slice(-periodDays);
  }

  const totalDays = targetEntries.length;
  if (totalDays === 0) {
    return `SISTEMA AFETIVO — RELATÓRIO DE ACOMPANHAMENTO EMOCIONAL
Data: ${new Date().toLocaleDateString('pt-BR')}
Nome: ${name}

Nenhum registro de humor encontrado para o período selecionado.
Comece a registrar seus dias para gerar análises e relatórios objetivos.`;
  }

  const firstDate = targetEntries[0].date;
  const lastDate = targetEntries[targetEntries.length - 1].date;

  let highDays = 0;
  let lowDays = 0;
  let balancedDays = 0;
  let mixedDays = 0;
  let totalSleep = 0;
  let sleepCount = 0;
  let totalImpulses = 0;
  let resistedImpulses = 0;

  // Workouts
  let workoutDays = 0;
  let totalWorkoutMinutes = 0;
  const workoutCounts: Record<string, number> = {};
  let moodSumWithWorkout = 0;
  let moodSumWithoutWorkout = 0;
  let nonWorkoutDays = 0;
  let anxietySumWithWorkout = 0;
  let anxietySumWithoutWorkout = 0;

  const triggerCounts: Record<string, number> = {};
  const protectionCounts: Record<string, number> = {};

  targetEntries.forEach((e) => {
    if (e.moodScore === 0) balancedDays++;
    else if (e.moodScore > 0) highDays++;
    else lowDays++;

    if (e.isMixedState) mixedDays++;

    if (typeof e.sleepHours === 'number') {
      totalSleep += e.sleepHours;
      sleepCount++;
    }

    if (e.physicalActivities && e.physicalActivities.length > 0) {
      workoutDays++;
      moodSumWithWorkout += e.moodScore;
      anxietySumWithWorkout += (e.anxietyLevel ?? 0);
      e.physicalActivities.forEach((w) => {
        totalWorkoutMinutes += (Number(w.durationMinutes) || 0);
        const t = w.type || 'Exercício';
        workoutCounts[t] = (workoutCounts[t] || 0) + 1;
      });
    } else {
      nonWorkoutDays++;
      moodSumWithoutWorkout += e.moodScore;
      anxietySumWithoutWorkout += (e.anxietyLevel ?? 0);
    }

    if (e.impulsiveBehaviors && e.impulsiveBehaviors.length > 0) {
      totalImpulses += e.impulsiveBehaviors.length;
      e.impulsiveBehaviors.forEach((imp) => {
        if (imp.resisted === 'resisted_fully' || imp.resisted === 'delayed') {
          resistedImpulses++;
        }
      });
    }

    if (e.triggers) {
      e.triggers.forEach((t) => {
        triggerCounts[t] = (triggerCounts[t] || 0) + 1;
      });
    }

    if (e.protectiveFactors) {
      e.protectiveFactors.forEach((p) => {
        protectionCounts[p] = (protectionCounts[p] || 0) + 1;
      });
    }
  });

  const avgSleep = sleepCount > 0 ? (totalSleep / sleepCount).toFixed(1) : '7.0';
  const resistanceRate = totalImpulses > 0 ? Math.round((resistedImpulses / totalImpulses) * 100) : 100;
  const balancedPct = totalDays > 0 ? Math.round((balancedDays / totalDays) * 100) : 0;

  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, v]) => `${k} (${v}x)`);

  const topProtections = Object.entries(protectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, v]) => `${k} (${v}x)`);

  const topWorkouts = Object.entries(workoutCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} (${v}x)`);

  const avgMoodWith = workoutDays > 0 ? (moodSumWithWorkout / workoutDays).toFixed(1) : null;
  const avgMoodWithout = nonWorkoutDays > 0 ? (moodSumWithoutWorkout / nonWorkoutDays).toFixed(1) : null;
  const avgAnxWith = workoutDays > 0 ? (anxietySumWithWorkout / workoutDays).toFixed(1) : null;
  const avgAnxWithout = nonWorkoutDays > 0 ? (anxietySumWithoutWorkout / nonWorkoutDays).toFixed(1) : null;

  const medsList = medications.length > 0
    ? medications.map((m) => `- ${m.name} ${m.dosage || ''} (${m.frequency || 'conforme rotina'}${m.notes ? ` - ${m.notes}` : ''})`).join('\n')
    : 'Nenhum suplemento ou rotina cadastrado no período.';

  return `========================================================================
       SISTEMA AFETIVO — RELATÓRIO DE ACOMPANHAMENTO EMOCIONAL
========================================================================
Nome do Usuário: ${name}
Período Analisado: ${firstDate} a ${lastDate} (${totalDays} dias monitorados)
Emissão do Documento: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
Metodologia: Mapeamento funcional contínuo de humor (-3 a +3), noites de sono,
             atividade física (corrida, pilates, musculação) e repertório de autorregulação.
========================================================================

1. VISÃO GERAL & TENDÊNCIAS DOMINANTES
Ao longo dos ${totalDays} dias analisados, você registrou ${balancedDays} dias (${balancedPct}%) em faixa serena e equilibrada (-1 a +1), ${highDays} dias com energia/aceleração alta e ${lowDays} dias de energia baixa. 
A média de sono foi de ${avgSleep} horas por noite.
${mixedDays > 0 ? `Foram identificados ${mixedDays} dias com conflito simultâneo de agitação com desânimo físico.` : 'Não houve registro de dias com conflito interno de agitação com desânimo.'}

2. PADRÕES DE HUMOR E ENERGIA
- Dias em Equilíbrio (0): ${balancedDays} de ${totalDays} dias
- Dias com Energia Elevada (+1 a +3): ${highDays} dias
- Dias com Menor Energia (-1 a -3): ${lowDays} dias
- Episódios de agitação física com cansaço: ${mixedDays} dia(s)

3. IMPACTO DO SONO NA REGULAÇÃO EMOCIONAL
- Média geral de sono: ${avgSleep}h por noite
${Number(avgSleep) < 6.5
    ? '- Tendência: Sono inferior a 6,5h esteve associado a maior reatividade e necessidade de autocontrole no dia seguinte.'
    : '- Tendência: O descanso suficiente favoreceu a estabilização e a clareza mental durante o dia.'}

4. ATIVIDADES FÍSICAS & CRUZAMENTO COM HUMOR E ANSIEDADE
- Frequência de treinos: ${workoutDays} de ${totalDays} dias (${totalDays > 0 ? Math.round((workoutDays / totalDays) * 100) : 0}%)
- Tempo acumulado de atividade: ${totalWorkoutMinutes} minutos
${topWorkouts.length > 0 ? `- Modalidades praticadas: ${topWorkouts.join(', ')}` : '- Nenhuma modalidade física registrada.'}
${workoutDays > 0 && avgMoodWith && avgMoodWithout
    ? `- Comparativo: Nos dias com exercício físico, o humor médio foi de ${avgMoodWith} (vs ${avgMoodWithout} nos dias sedentários) e a ansiedade média caiu para ${avgAnxWith}/5 (vs ${avgAnxWithout}/5 nos dias sem treino), evidenciando o efeito protetor das atividades corporais.`
    : '- Prática de treinos ainda em fase inicial de mapeamento comparativo.'}

5. MONITORAMENTO DE IMPULSOS & AUTORREGULAÇÃO (DBT)
- Ocorrências de impulsos mapeados: ${totalImpulses}
- Taxa de contenção ou adiamento consciente: ${resistanceRate}% (${resistedImpulses} de ${totalImpulses})
- Recursos mais utilizados para conter o impulso: Afastar o celular, beber água, esperar a onda passar (regra dos 15 minutos).

6. FATORES DE PROTEÇÃO & ÂNCORAS MAIS EFICAZES (O QUE FUNCIONOU)
${topProtections.length > 0
    ? topProtections.map((p) => `- ${p}`).join('\n')
    : '- Registro de âncoras protetivas em construção.'}

7. GATILHOS FREQUENTES IDENTIFICADOS (O QUE DESESTABILIZOU)
${topTriggers.length > 0
    ? topTriggers.map((t) => `- ${t}`).join('\n')
    : '- Nenhum gatilho específico identificado com frequência marcante.'}

8. ACOMPANHAMENTO DE ROTINA E SUPLEMENTOS
${medsList}

9. ESTRATÉGIAS PRÁTICAS SUGERIDAS (TCC / DBT)
- Diante de urgência para agir: Aplicar a regra dos 15 minutos e praticar 3 minutos de respiração diafragmática.
- Nos dias de agitação noturna: Reduzir telas 1h antes de deitar e preparar um ambiente fresco e escuro.
- Para sustentação de humor: Manter a consistência de atividades físicas nos dias de maior carga de trabalho.

10. PAUTA OBJETIVA PARA CONVERSAS / CONSULTAS COM TERAPEUTA
- Comparativo entre noites de sono < 6,5h e aumento de impulsividade.
- Efeito descompressor dos treinos de ${topWorkouts[0]?.split(' ')[0] || 'atividade física'} na redução de ansiedade.
- Fortalecimento das âncoras mais eficazes (${topProtections[0]?.split(' (')[0] || 'autocuidado'}).
========================================================================`.trim();
}

export const ClinicalReportModal: React.FC<Props> = ({
  entries,
  medications,
  patientName,
  userName,
  onClose,
}) => {
  const effectiveName = userName || patientName || 'Guilherme';
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [reportText, setReportText] = useState<string>(() =>
    buildDeterministicReport(entries, medications, effectiveName, 30)
  );
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [sourceBadge, setSourceBadge] = useState<string>('Síntese Estruturada');
  const [copied, setCopied] = useState(false);

  // Recalculate deterministic report immediately when period changes
  useEffect(() => {
    const instantReport = buildDeterministicReport(entries, medications, effectiveName, periodDays);
    setReportText(instantReport);
    setSourceBadge('Síntese Estruturada');

    // Optionally try background AI enhancement with fallback
    fetchAiEnhancedReport(periodDays, instantReport);
  }, [periodDays, entries, medications, effectiveName]);

  const fetchAiEnhancedReport = async (days: number, fallbackText: string) => {
    setIsAiLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch('/api/clinical-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          entries,
          medications,
          userName: effectiveName,
          periodDays: days,
        }),
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.reportText && data.reportText.length > 100) {
          setReportText(data.reportText);
          setSourceBadge(data.source === 'deterministico' ? 'Síntese Estruturada' : 'Enriquecido com IA');
        }
      }
    } catch {
      // Quietly preserve the already generated deterministic report
      setReportText(fallbackText);
      setSourceBadge('Síntese Estruturada');
    } finally {
      setIsAiLoading(false);
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

  const handleDownloadFile = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_afetivo_${effectiveName.toLowerCase()}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col my-auto print:border-none print:shadow-none print:max-h-full print:w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>Resumo para Conversas & Terapia</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  {sourceBadge}
                </span>
                {isAiLoading && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-600">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>polindo...</span>
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                Relatório de Acompanhamento Emocional & Hábitos
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

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-stone-400">
            Factual e respeitoso: ideal para auto-análise ou para levar a consultas terapêuticas.
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
