import React, { useState } from 'react';
import { AfetivoEntry, Medication, ClinicalPatternAnalysis } from '../types/mood';
import { Sparkles, Brain, Clock, ShieldAlert, Lightbulb, RefreshCw, FileText, CheckCircle2, TrendingUp, AlertTriangle, ShieldCheck, Dumbbell } from 'lucide-react';

interface Props {
  entries: AfetivoEntry[];
  medications: Medication[];
  onOpenReportModal: () => void;
}

export const PatternAnalyzer: React.FC<Props> = ({
  entries,
  medications,
  onOpenReportModal,
}) => {
  const [analysis, setAnalysis] = useState<ClinicalPatternAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisSource, setAnalysisSource] = useState<string | null>(null);

  // Calculate local statistics
  const totalDays = entries.length;
  let balancedDays = 0;
  let highEnergyDays = 0;
  let lowEnergyDays = 0;
  let mixedDays = 0;
  let totalSleep = 0;
  let sleepCount = 0;
  let totalImpulses = 0;
  let resistedImpulses = 0;
  let totalProtectionsUsed = 0;
  const protectionCounts: Record<string, number> = {};

  // Physical Activity Cross-analysis
  let workoutDays = 0;
  let totalWorkoutMinutes = 0;
  const workoutTypeCounts: Record<string, number> = {};
  let moodSumWithWorkout = 0;
  let moodSumWithoutWorkout = 0;
  let nonWorkoutDays = 0;
  let anxietySumWithWorkout = 0;
  let anxietySumWithoutWorkout = 0;
  let sleepSumWithWorkout = 0;
  let sleepSumWithoutWorkout = 0;

  entries.forEach((e) => {
    if (e.moodScore === 0) balancedDays++;
    else if (e.moodScore > 0) highEnergyDays++;
    else lowEnergyDays++;

    if (e.isMixedState) mixedDays++;

    if (typeof e.sleepHours === 'number') {
      totalSleep += e.sleepHours;
      sleepCount++;
    }

    // Physical Activity
    const hasWorkouts = e.physicalActivities && e.physicalActivities.length > 0;
    if (hasWorkouts) {
      workoutDays++;
      moodSumWithWorkout += e.moodScore;
      anxietySumWithWorkout += (e.anxietyLevel ?? 0);
      sleepSumWithWorkout += (e.sleepHours ?? 0);
      e.physicalActivities!.forEach((w) => {
        totalWorkoutMinutes += (Number(w.durationMinutes) || 0);
        const t = w.type || 'Outro';
        workoutTypeCounts[t] = (workoutTypeCounts[t] || 0) + 1;
      });
    } else {
      nonWorkoutDays++;
      moodSumWithoutWorkout += e.moodScore;
      anxietySumWithoutWorkout += (e.anxietyLevel ?? 0);
      sleepSumWithoutWorkout += (e.sleepHours ?? 0);
    }

    if (e.impulsiveBehaviors && e.impulsiveBehaviors.length > 0) {
      totalImpulses += e.impulsiveBehaviors.length;
      e.impulsiveBehaviors.forEach((imp) => {
        if (imp.resisted === 'resisted_fully' || imp.resisted === 'delayed') {
          resistedImpulses++;
        }
      });
    }

    if (e.protectiveFactors && e.protectiveFactors.length > 0) {
      totalProtectionsUsed += e.protectiveFactors.length;
      e.protectiveFactors.forEach((p) => {
        protectionCounts[p] = (protectionCounts[p] || 0) + 1;
      });
    }
  });

  const avgSleep = sleepCount > 0 ? (totalSleep / sleepCount).toFixed(1) : '0';
  const balancedPercentage = totalDays > 0 ? Math.round((balancedDays / totalDays) * 100) : 0;
  const resistanceRate = totalImpulses > 0 ? Math.round((resistedImpulses / totalImpulses) * 100) : 0;

  const topAnchors = Object.entries(protectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, v]) => ({ name: k, count: v }));

  const topWorkouts = Object.entries(workoutTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ type: k, count: v }));

  const avgMoodWith = workoutDays > 0 ? (moodSumWithWorkout / workoutDays).toFixed(1) : null;
  const avgMoodWithout = nonWorkoutDays > 0 ? (moodSumWithoutWorkout / nonWorkoutDays).toFixed(1) : null;
  const avgAnxietyWith = workoutDays > 0 ? (anxietySumWithWorkout / workoutDays).toFixed(1) : null;
  const avgAnxietyWithout = nonWorkoutDays > 0 ? (anxietySumWithoutWorkout / nonWorkoutDays).toFixed(1) : null;
  const avgSleepWith = workoutDays > 0 ? (sleepSumWithWorkout / workoutDays).toFixed(1) : null;
  const avgSleepWithout = nonWorkoutDays > 0 ? (sleepSumWithoutWorkout / nonWorkoutDays).toFixed(1) : null;

  // Personal Evolution Metrics (Valor Real: Comparação primeiros registros vs recentes)
  let evolutionText = '';
  let balancedChangePct = 0;

  if (entries.length >= 6) {
    const sortedChrono = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const half = Math.floor(sortedChrono.length / 2);
    const firstHalf = sortedChrono.slice(0, half);
    const secondHalf = sortedChrono.slice(half);

    const b1 = (firstHalf.filter((e) => Math.abs(e.moodScore) <= 1).length / firstHalf.length) * 100;
    const b2 = (secondHalf.filter((e) => Math.abs(e.moodScore) <= 1).length / secondHalf.length) * 100;
    balancedChangePct = Math.round(b2 - b1);

    const protCount1 = firstHalf.reduce((sum, e) => sum + (e.protectiveFactors?.length || 0), 0);
    const protCount2 = secondHalf.reduce((sum, e) => sum + (e.protectiveFactors?.length || 0), 0);
    const avgProt1 = protCount1 / firstHalf.length;
    const avgProt2 = protCount2 / secondHalf.length;

    if (balancedChangePct >= 0) {
      evolutionText = `Ao longo do período, você aumentou em ${Math.abs(balancedChangePct)}% os dias em faixa equilibrada (-1 a +1) e manteve média de ${avgProt2.toFixed(1)} âncoras ativas por dia.`;
    } else {
      evolutionText = `Monitorando período com mais desafios. Seu uso de proteções ativas registrou média de ${avgProt2.toFixed(1)} âncoras/dia, ajudando a conter impactos.`;
    }
  } else {
    evolutionText = `Você já deu os primeiros passos registrando ${totalDays} dias. À medida que mais registros forem adicionados, suas métricas de evolução comparativa aparecerão aqui.`;
  }

  const handleRunAiAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/analyze-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries,
          medications,
          timeFrameDays: 30,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com o assistente de análise.');
      }

      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        setAnalysisSource(data.source || 'gemini-3.8-flash');
      } else {
        throw new Error('Resposta de análise vazia.');
      }
    } catch (err: any) {
      console.error('Error fetching pattern analysis:', err);
      setErrorMsg('Não foi possível conectar ao assistente. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="text-xs text-stone-500 flex items-center justify-between mb-1">
            <span>Dias Equilibrados</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {balancedPercentage}%
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {balancedDays} de {totalDays} dias estáveis
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="text-xs text-stone-500 flex items-center justify-between mb-1">
            <span>Média de Sono</span>
            <Clock className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {avgSleep}h
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {Number(avgSleep) < 6.5 ? 'Abaixo da média' : 'Faixa de sono regular'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="text-xs text-stone-500 flex items-center justify-between mb-1">
            <span>Atividade Física</span>
            <Dumbbell className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-teal-700 dark:text-teal-400">
            {workoutDays}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {totalWorkoutMinutes} min acumulados
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="text-xs text-stone-500 flex items-center justify-between mb-1">
            <span>Impulsos</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {totalImpulses}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {resistanceRate}% contidos ou adiados
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="text-xs text-stone-500 flex items-center justify-between mb-1">
            <span>Proteções & Âncoras</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
            {totalProtectionsUsed}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {topAnchors.length > 0 ? `${topAnchors.length} tipos acionados` : '0 vezes'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="text-xs text-stone-500 flex items-center justify-between mb-1">
            <span>Agitação + Cansaço</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {mixedDays}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            dias com conflito interno
          </div>
        </div>
      </div>

      {/* Cruzamento de Dados: Atividade Física & Humor (Sempre Visível) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Cruzamento de Dados: Atividade Física & Humor</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-teal-100/70 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Correlação Real
                </span>
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Comparativo estatístico direto entre os dias em que você se exercitou (corrida, pilates, musculação, etc.) e os dias sem treino.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-stone-500">
            {workoutDays} de {totalDays} dias com treino ({totalDays > 0 ? Math.round((workoutDays / totalDays) * 100) : 0}%)
          </div>
        </div>

        {workoutDays === 0 ? (
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 text-stone-500 text-xs">
            Nenhuma atividade física registrada até o momento. Ao cadastrar seus treinos (corrida, pilates, musculação, etc.) no formulário diário, os cruzamentos automáticos de humor, sono e ansiedade aparecerão aqui.
          </div>
        ) : (
          <div className="space-y-4">
            {/* 3 Metric Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Humor Comparison */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60 text-xs space-y-2">
                <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                  Humor Médio
                </span>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] text-stone-500 block">Com Treino</span>
                    <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                      {avgMoodWith !== null ? (Number(avgMoodWith) > 0 ? `+${avgMoodWith}` : avgMoodWith) : '-'}
                    </span>
                  </div>
                  <span className="text-stone-300 dark:text-stone-700 text-xl font-light">vs</span>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-500 block">Sem Treino</span>
                    <span className="text-lg font-bold font-mono text-stone-700 dark:text-stone-300">
                      {avgMoodWithout !== null ? (Number(avgMoodWithout) > 0 ? `+${avgMoodWithout}` : avgMoodWithout) : '-'}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-stone-400 border-t border-stone-200/50 dark:border-stone-700/50 pt-1.5">
                  {avgMoodWith && avgMoodWithout && Number(avgMoodWith) >= Number(avgMoodWithout)
                    ? 'Humor mais equilibrado e elevado nos dias ativos.'
                    : 'Acompanhando tendências de oscilação.'}
                </div>
              </div>

              {/* Ansiedade Comparison */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60 text-xs space-y-2">
                <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                  Nível de Ansiedade (0-5)
                </span>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] text-stone-500 block">Com Treino</span>
                    <span className="text-lg font-bold font-mono text-teal-700 dark:text-teal-400">
                      {avgAnxietyWith !== null ? `${avgAnxietyWith}/5` : '-'}
                    </span>
                  </div>
                  <span className="text-stone-300 dark:text-stone-700 text-xl font-light">vs</span>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-500 block">Sem Treino</span>
                    <span className="text-lg font-bold font-mono text-stone-700 dark:text-stone-300">
                      {avgAnxietyWithout !== null ? `${avgAnxietyWithout}/5` : '-'}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-stone-400 border-t border-stone-200/50 dark:border-stone-700/50 pt-1.5">
                  {avgAnxietyWith && avgAnxietyWithout && Number(avgAnxietyWith) < Number(avgAnxietyWithout)
                    ? `Ansiedade ${(
                        ((Number(avgAnxietyWithout) - Number(avgAnxietyWith)) /
                          (Number(avgAnxietyWithout) || 1)) *
                        100
                      ).toFixed(0)}% menor nos dias com exercício.`
                    : 'Monitorando impacto na tensão corporal.'}
                </div>
              </div>

              {/* Sono Comparison */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60 text-xs space-y-2">
                <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                  Sono Médio (horas)
                </span>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] text-stone-500 block">Com Treino</span>
                    <span className="text-lg font-bold font-mono text-sky-700 dark:text-sky-400">
                      {avgSleepWith !== null ? `${avgSleepWith}h` : '-'}
                    </span>
                  </div>
                  <span className="text-stone-300 dark:text-stone-700 text-xl font-light">vs</span>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-500 block">Sem Treino</span>
                    <span className="text-lg font-bold font-mono text-stone-700 dark:text-stone-300">
                      {avgSleepWithout !== null ? `${avgSleepWithout}h` : '-'}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-stone-400 border-t border-stone-200/50 dark:border-stone-700/50 pt-1.5">
                  {avgSleepWith && avgSleepWithout && Number(avgSleepWith) >= 7.0
                    ? 'Qualidade e regularidade do descanso preservadas.'
                    : 'Sono correlacionado com a rotina de exercícios.'}
                </div>
              </div>
            </div>

            {/* Modalidades Praticadas */}
            {topWorkouts.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                <span className="text-stone-500 font-medium">Modalidades praticadas:</span>
                {topWorkouts.map((w) => (
                  <span
                    key={w.type}
                    className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60 text-teal-900 dark:text-teal-200 font-medium text-[11px]"
                  >
                    {w.type} ({w.count}x)
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card de Métricas de Valor Real & Evolução Pessoal */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-200/80 dark:border-teal-800/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                Métricas de Evolução Pessoal & Autorregulação
              </h4>
              <p className="text-[11px] text-stone-500">
                Comparativo real de desenvolvimento de repertório protetivo ao longo do tempo.
              </p>
            </div>
          </div>
          {balancedChangePct !== 0 && (
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                balancedChangePct > 0
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              {balancedChangePct > 0 ? `+${balancedChangePct}% equilíbrio` : `${balancedChangePct}% oscilação`}
            </span>
          )}
        </div>

        <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
          {evolutionText}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-teal-100 dark:border-teal-900/40 text-[11px]">
          <div>
            <span className="text-stone-400 block">Estabilidade (−1 a +1):</span>
            <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
              {balancedPercentage}% dos dias
            </span>
          </div>
          <div>
            <span className="text-stone-400 block">Contenção de Impulsos:</span>
            <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
              {resistanceRate}% contidos/adiados
            </span>
          </div>
          <div>
            <span className="text-stone-400 block">Dias com Atividade:</span>
            <span className="font-bold text-teal-700 dark:text-teal-400 font-mono">
              {workoutDays} de {totalDays} dias
            </span>
          </div>
          <div>
            <span className="text-stone-400 block">Uso de Âncoras:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              {totalProtectionsUsed} acionamentos
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-0.5">
            <span>Análise de Padrões Emocionais</span>
            <span aria-hidden="true">·</span>
            <span>Autoconhecimento & Ajustes de Estratégia</span>
          </div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Detecção de Padrões, Sono & Hábitos
          </h3>
          <p className="text-xs text-stone-500 max-w-xl mt-1">
            Correlaciona seus registros de humor, noites de sono, momentos de impulso e rotinas para identificar o que te ajuda a se manter bem e o que desencadeia reatividades.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleRunAiAnalysis}
            disabled={isLoading || totalDays === 0}
            className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processando padrões...</span>
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5" />
                <span>Analisar Padrões com IA</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenReportModal}
            className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-stone-500" />
            <span>Gerar Resumo para Conversa</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Analysis Result Display */}
      {analysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Síntese de Padrões Emocionais</span>
            <span>Processado por: {analysisSource}</span>
          </div>

          {/* Resumo Geral */}
          <div className="p-5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/60">
            <h4 className="font-semibold text-teal-900 dark:text-teal-200 text-sm mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>Visão Geral & Tendências Dominantes</span>
            </h4>
            <p className="text-xs text-teal-950 dark:text-teal-200/90 leading-relaxed font-medium">
              {analysis.resumo_geral || analysis.summary}
            </p>
          </div>

          {/* Ponto Positivo & Reconhecimento Genuíno */}
          {analysis.ponto_positivo && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1">
                <strong className="text-amber-900 dark:text-amber-200 block">
                  Reconhecimento & O que está funcionando bem
                </strong>
                <p className="text-amber-950 dark:text-amber-100/90 leading-relaxed">
                  {analysis.ponto_positivo}
                </p>
              </div>
            </div>
          )}

          {/* Correlações Principais */}
          {analysis.correlacoes_principais && analysis.correlacoes_principais.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-3">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>Correlações Observadas no Período</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analysis.correlacoes_principais.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 text-xs space-y-1.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-stone-900 dark:text-stone-100">
                          {c.titulo}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            c.forca === 'forte'
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                              : c.forca === 'moderada'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                          }`}
                        >
                          {c.forca}
                        </span>
                      </div>
                      <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                        {c.observacao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estratégias Práticas (Estilo TCC / DBT) */}
          {analysis.estrategias_praticas && analysis.estrategias_praticas.length > 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-3">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2 text-teal-700 dark:text-teal-400">
                <Lightbulb className="w-4 h-4 text-teal-600" />
                <span>Estratégias Práticas Acionáveis (TCC / DBT)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analysis.estrategias_praticas.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 text-xs space-y-2"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-mono text-stone-400 block mb-0.5">
                        Quando isso acontecer:
                      </span>
                      <strong className="text-stone-800 dark:text-stone-200 block">
                        {st.situacao}
                      </strong>
                    </div>
                    <div className="pt-2 border-t border-stone-200/50 dark:border-stone-700/50">
                      <span className="text-[10px] uppercase font-mono text-teal-600 dark:text-teal-400 block mb-0.5">
                        Ação sugerida:
                      </span>
                      <p className="text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                        {st.acao_sugerida}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : analysis.suggestedStrategies && analysis.suggestedStrategies.length > 0 ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm mb-3 flex items-center gap-2 text-teal-700 dark:text-teal-400">
                <Lightbulb className="w-4 h-4 text-teal-600" />
                <span>Estratégias Práticas de Mudança</span>
              </h4>
              <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
                {analysis.suggestedStrategies.map((st, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Gatilhos & Proteções Mais Eficazes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gatilhos Frequentes */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Gatilhos que Mais Desestabilizaram</span>
              </h4>
              <p className="text-[11px] text-stone-400">
                Fatores ambientais, rotineiros ou relacionais que mais demandaram energia:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(analysis.gatilhos_mais_frequentes || []).map((g, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Proteções Mais Eficazes */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Proteções que Mais Funcionaram</span>
              </h4>
              <p className="text-[11px] text-stone-400">
                Âncoras ativas que mais ajudaram na recuperação e estabilização:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(analysis.protecoes_mais_eficazes || []).map((p, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sinais de Alerta Prévios */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Sinais de Alerta Prévios Identificados</span>
            </h4>
            <p className="text-[11px] text-stone-400">
              Padrões observáveis que costumam anteceder oscilações de energia ou picos de urgência:
            </p>
            <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 pt-1">
              {(analysis.sinais_de_alerta_previos || analysis.earlyWarningSigns || []).map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Physical Activity Cross-Correlation Insight */}
          {(analysis.observacao_exercicio || analysis.physicalActivityCorrelation) && (
            <div className="p-5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60">
              <h4 className="font-semibold text-teal-900 dark:text-teal-200 text-sm mb-2 flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>Cruzamento: Atividade Física & Regulação do Humor</span>
              </h4>
              <p className="text-xs text-teal-950 dark:text-teal-200/90 leading-relaxed font-medium">
                {analysis.observacao_exercicio || analysis.physicalActivityCorrelation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
