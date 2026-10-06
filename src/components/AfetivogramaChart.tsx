import React, { useState } from 'react';
import { AfetivoEntry, MOOD_LEVEL_CONFIG } from '../types/mood';
import { Moon, AlertTriangle, Zap, Dumbbell, ShieldCheck, TrendingUp, Target } from 'lucide-react';

interface Props {
  entries: AfetivoEntry[];
  timeFrameDays: number;
  onSelectEntry?: (entry: AfetivoEntry) => void;
}

export const AfetivogramaChart: React.FC<Props> = ({
  entries,
  timeFrameDays,
  onSelectEntry,
}) => {
  const [hoveredEntry, setHoveredEntry] = useState<AfetivoEntry | null>(null);
  const [showSleepCurve, setShowSleepCurve] = useState(true);
  const [showImpulseMarkers, setShowImpulseMarkers] = useState(true);
  const [showWorkouts, setShowWorkouts] = useState(true);
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [movingAverageDays, setMovingAverageDays] = useState<3 | 7>(3);
  const [showBaseline, setShowBaseline] = useState(true);

  // Filter entries according to timeFrameDays
  const now = new Date();
  const filteredEntries = entries.filter((e) => {
    if (timeFrameDays === 0) return true; // all
    const entryDate = new Date(e.date + 'T12:00:00');
    const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
    return diffDays <= timeFrameDays + 0.5;
  });

  // Sort chronologically
  const sorted = [...filteredEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Chart dimensions & scaling
  const width = 860;
  const height = 340;
  const paddingLeft = 56;
  const paddingRight = 44;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Y-Scale: moodScore from -3 to +3
  const getYForMood = (score: number) => {
    const normalized = (3 - score) / 6;
    return paddingTop + normalized * chartHeight;
  };

  // Y-Scale: Sleep from 0 to 12 hours
  const getYForSleep = (hours: number) => {
    const clamped = Math.max(0, Math.min(12, hours));
    const normalized = (12 - clamped) / 12;
    return paddingTop + normalized * chartHeight;
  };

  const getXForIndex = (index: number, total: number) => {
    if (total <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (total - 1)) * chartWidth;
  };

  // Personal Baseline (Média Pessoal de Humor no período)
  const personalBaseline = sorted.length > 0
    ? sorted.reduce((sum, e) => sum + e.moodScore, 0) / sorted.length
    : 0;
  const yBaseline = getYForMood(personalBaseline);

  // Generate Mood Path points
  const points = sorted.map((entry, index) => ({
    x: getXForIndex(index, sorted.length),
    y: getYForMood(entry.moodScore),
    entry,
  }));

  // Generate smooth SVG curve for mood
  const moodPathD = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    const cp2y = point.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  }, '');

  // Moving Average Points (3 or 7 days)
  const movingAveragePoints = sorted.map((entry, index) => {
    const windowStart = Math.max(0, index - movingAverageDays + 1);
    const windowSlice = sorted.slice(windowStart, index + 1);
    const avgScore = windowSlice.reduce((s, item) => s + item.moodScore, 0) / windowSlice.length;
    return {
      x: getXForIndex(index, sorted.length),
      y: getYForMood(avgScore),
      avgScore,
      entry,
    };
  });

  const movingAveragePathD = movingAveragePoints.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    const cp2y = point.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  }, '');

  // Sleep points
  const sleepPoints = sorted.map((entry, index) => ({
    x: getXForIndex(index, sorted.length),
    y: getYForSleep(entry.sleepHours),
    sleepHours: entry.sleepHours,
    entry,
  }));

  const sleepPathD = sleepPoints.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  const yPlus1 = getYForMood(1);
  const yMinus1 = getYForMood(-1);

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 md:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <span>Gráfico de Humor & Sono</span>
            <span aria-hidden="true">·</span>
            <span>Rastreamento de Padrões Pessoais</span>
          </div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            Oscilações de Humor & Noites de Sono
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowSleepCurve(!showSleepCurve)}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showSleepCurve
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-medium'
                : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-500'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Curva de Sono</span>
          </button>

          <button
            onClick={() => setShowWorkouts(!showWorkouts)}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showWorkouts
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium'
                : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-500'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Atividades Físicas</span>
          </button>

          <button
            onClick={() => setShowImpulseMarkers(!showImpulseMarkers)}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showImpulseMarkers
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium'
                : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Episódios Impulsivos</span>
          </button>

          {/* Média Móvel / Tendência */}
          <div className="flex items-center rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-0.5">
            <button
              onClick={() => setShowMovingAverage(!showMovingAverage)}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer text-xs ${
                showMovingAverage
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-medium'
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
              title="Suavizar oscilações diárias com média móvel"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>Tendência ({movingAverageDays}d)</span>
            </button>
            {showMovingAverage && (
              <div className="flex items-center gap-0.5 border-l border-stone-200 dark:border-stone-700 pl-1 ml-1 text-[11px] font-mono">
                <button
                  onClick={() => setMovingAverageDays(3)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    movingAverageDays === 3
                      ? 'bg-amber-500 text-white font-bold'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  3d
                </button>
                <button
                  onClick={() => setMovingAverageDays(7)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    movingAverageDays === 7
                      ? 'bg-amber-500 text-white font-bold'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  7d
                </button>
              </div>
            )}
          </div>

          {/* Baseline Pessoal */}
          <button
            onClick={() => setShowBaseline(!showBaseline)}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showBaseline
                ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-300 font-medium'
                : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-500'
            }`}
            title="Sua média pessoal calculada automaticamente para o período"
          >
            <Target className="w-3.5 h-3.5 text-violet-600" />
            <span>Sua Média ({personalBaseline > 0 ? `+${personalBaseline.toFixed(1)}` : personalBaseline.toFixed(1)})</span>
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="py-16 text-center text-stone-500 dark:text-stone-400">
          Nenhum registro encontrado no período selecionado.
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[620px] select-none"
          >
            {/* Background Zones */}
            {/* High Energy Zone (Upper) */}
            <rect
              x={paddingLeft}
              y={paddingTop}
              width={chartWidth}
              height={yPlus1 - paddingTop}
              className="fill-amber-500/5 dark:fill-amber-500/10"
            />
            {/* Balanced Stability Band (-1 to +1) */}
            <rect
              x={paddingLeft}
              y={yPlus1}
              width={chartWidth}
              height={yMinus1 - yPlus1}
              className="fill-emerald-500/5 dark:fill-emerald-500/10"
            />
            {/* Low Energy Zone (Lower) */}
            <rect
              x={paddingLeft}
              y={yMinus1}
              width={chartWidth}
              height={paddingTop + chartHeight - yMinus1}
              className="fill-indigo-500/5 dark:fill-indigo-500/10"
            />

            {/* Horizontal Grid lines */}
            {[-3, -2, -1, 0, 1, 2, 3].map((score) => {
              const y = getYForMood(score);
              const isBase = score === 0;
              return (
                <g key={score}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={paddingLeft + chartWidth}
                    y2={y}
                    stroke={isBase ? '#10b981' : '#e2e8f0'}
                    strokeWidth={isBase ? 1.5 : 1}
                    strokeDasharray={isBase ? 'none' : '4 4'}
                    className={
                      isBase
                        ? 'stroke-emerald-600 dark:stroke-emerald-500/80'
                        : 'stroke-stone-200 dark:stroke-stone-800'
                    }
                  />
                  {/* Left Label */}
                  <text
                    x={paddingLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className={`text-[10px] font-mono tabular-nums ${
                      isBase
                        ? 'fill-emerald-700 dark:fill-emerald-400 font-semibold'
                        : score > 0
                        ? 'fill-amber-700 dark:fill-amber-400'
                        : 'fill-indigo-600 dark:fill-indigo-400'
                    }`}
                  >
                    {score > 0 ? `+${score}` : score}
                  </text>
                </g>
              );
            })}

            {/* Right axis for sleep hours */}
            {showSleepCurve && (
              <g>
                {[4, 7, 10].map((hours) => {
                  const y = getYForSleep(hours);
                  return (
                    <text
                      key={hours}
                      x={paddingLeft + chartWidth + 8}
                      y={y + 3.5}
                      textAnchor="start"
                      className="text-[9px] font-mono tabular-nums fill-sky-600 dark:fill-sky-400"
                    >
                      {hours}h
                    </text>
                  );
                })}
              </g>
            )}

            {/* Vertical date guides */}
            {points.map((pt) => (
              <g key={pt.entry.id}>
                <line
                  x1={pt.x}
                  y1={paddingTop}
                  x2={pt.x}
                  y2={paddingTop + chartHeight}
                  className="stroke-stone-100 dark:stroke-stone-800/60"
                  strokeWidth="1"
                />
                <text
                  x={pt.x}
                  y={paddingTop + chartHeight + 18}
                  textAnchor="middle"
                  className="text-[9px] font-mono tabular-nums fill-stone-400 dark:fill-stone-500"
                >
                  {pt.entry.date.slice(5).replace('-', '/')}
                </text>
              </g>
            ))}

            {/* Sleep Curve */}
            {showSleepCurve && (
              <path
                d={sleepPathD}
                fill="none"
                stroke="#0284c7"
                strokeWidth="1.75"
                strokeDasharray="4 3"
                opacity="0.85"
              />
            )}

            {/* Personal Baseline Line */}
            {showBaseline && sorted.length > 0 && (
              <g>
                <line
                  x1={paddingLeft}
                  y1={yBaseline}
                  x2={paddingLeft + chartWidth}
                  y2={yBaseline}
                  stroke="#8b5cf6"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                  opacity="0.85"
                />
                <rect
                  x={paddingLeft + chartWidth - 84}
                  y={yBaseline - 16}
                  width="80"
                  height="15"
                  rx="4"
                  className="fill-violet-100 dark:fill-violet-950 stroke-violet-300 dark:stroke-violet-800"
                />
                <text
                  x={paddingLeft + chartWidth - 44}
                  y={yBaseline - 5}
                  textAnchor="middle"
                  className="text-[9px] font-mono fill-violet-800 dark:fill-violet-300 font-semibold"
                >
                  Sua Média {personalBaseline > 0 ? `+${personalBaseline.toFixed(1)}` : personalBaseline.toFixed(1)}
                </text>
              </g>
            )}

            {/* Moving Average Trend Curve */}
            {showMovingAverage && (
              <path
                d={movingAveragePathD}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.25"
                strokeDasharray="4 3"
                opacity="0.9"
              />
            )}

            {/* Mood Path */}
            <path
              d={moodPathD}
              fill="none"
              stroke="#0f766e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-teal-400"
            />

            {/* Interactive Data Points */}
            {points.map((pt) => {
              const { entry } = pt;
              const hasImpulse = entry.impulsiveBehaviors && entry.impulsiveBehaviors.length > 0;
              const hasWorkout = entry.physicalActivities && entry.physicalActivities.length > 0;
              const hasProtections = entry.protectiveFactors && entry.protectiveFactors.length > 0;
              const isSelected = hoveredEntry?.id === entry.id;

              return (
                <g
                  key={entry.id}
                  className="cursor-pointer transition-transform"
                  onClick={() => {
                    setHoveredEntry(isSelected ? null : entry);
                    if (onSelectEntry) onSelectEntry(entry);
                  }}
                  onMouseEnter={() => setHoveredEntry(entry)}
                  onMouseLeave={() => setHoveredEntry(null)}
                >
                  {/* Invisible enlarged hit target for mobile/touch */}
                  <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                  {/* Outer halo if mixed/conflict state */}
                  {entry.isMixedState && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="11"
                      fill="none"
                      stroke="#e11d48"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      className="animate-pulse"
                    />
                  )}

                  {/* Primary Node */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 6 : 4.5}
                    className={`${
                      entry.moodScore > 0
                        ? 'fill-amber-500 stroke-white dark:stroke-stone-900'
                        : entry.moodScore < 0
                        ? 'fill-indigo-500 stroke-white dark:stroke-stone-900'
                        : 'fill-emerald-600 stroke-white dark:stroke-stone-900'
                    } transition-all`}
                    strokeWidth="2"
                  />

                  {/* Sleep indicator node */}
                  {showSleepCurve && (
                    <circle
                      cx={pt.x}
                      cy={getYForSleep(entry.sleepHours)}
                      r="3"
                      className="fill-sky-500 stroke-white dark:stroke-stone-900"
                      strokeWidth="1"
                    />
                  )}

                  {/* Impulse Warning Diamond */}
                  {showImpulseMarkers && hasImpulse && (
                    <g transform={`translate(${pt.x}, ${pt.y - 12})`}>
                      <polygon
                        points="0,-4 4,0 0,4 -4,0"
                        className="fill-rose-500 stroke-white dark:stroke-stone-900"
                        strokeWidth="1"
                      />
                    </g>
                  )}

                  {/* Physical Activity Indicator */}
                  {showWorkouts && hasWorkout && (
                    <g transform={`translate(${pt.x}, ${pt.y + 11})`}>
                      <circle
                        r="4"
                        className="fill-emerald-600 stroke-white dark:stroke-stone-900"
                        strokeWidth="1"
                      />
                      <rect x="-2" y="-0.8" width="4" height="1.6" fill="white" rx="0.5" />
                    </g>
                  )}

                  {/* Protection Factor Indicator */}
                  {hasProtections && (
                    <g transform={`translate(${pt.x + 8}, ${pt.y - 8})`}>
                      <circle
                        r="2.5"
                        className="fill-teal-600 stroke-white dark:stroke-stone-900"
                        strokeWidth="0.8"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Dynamic Hover Tooltip / Detail Card */}
      {hoveredEntry && (
        <div className="mt-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700/80 text-xs transition-all space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-700/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {new Date(hoveredEntry.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <span aria-hidden="true" className="text-stone-400">·</span>
              <span
                className={`font-semibold ${
                  MOOD_LEVEL_CONFIG[hoveredEntry.moodScore].color
                }`}
              >
                {hoveredEntry.moodLabel} ({hoveredEntry.moodScore > 0 ? `+${hoveredEntry.moodScore}` : hoveredEntry.moodScore})
              </span>
              {hoveredEntry.isMixedState && (
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  · Agitação com Desânimo
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400 font-mono">
              <span className="flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-sky-500" />
                {hoveredEntry.sleepHours}h de sono
              </span>
              <span>Ansiedade: {hoveredEntry.anxietyLevel}/5</span>
              <span>Irritabilidade: {hoveredEntry.irritabilityLevel}/5</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              {hoveredEntry.emotions.length > 0 && (
                <div className="mb-1 text-stone-600 dark:text-stone-400">
                  <strong className="text-stone-700 dark:text-stone-300">Emoções:</strong>{' '}
                  {hoveredEntry.emotions.join(', ')}
                </div>
              )}
              {hoveredEntry.triggers.length > 0 && (
                <div className="text-stone-600 dark:text-stone-400">
                  <strong className="text-stone-700 dark:text-stone-300">Gatilhos:</strong>{' '}
                  {hoveredEntry.triggers.join(', ')}
                </div>
              )}
            </div>

            <div>
              {hoveredEntry.impulsiveBehaviors?.length > 0 && (
                <div className="text-rose-600 dark:text-rose-400 font-medium mb-1">
                  <strong>Impulso:</strong> {hoveredEntry.impulsiveBehaviors.map((b) => b.type).join(', ')}
                </div>
              )}
              {hoveredEntry.journalNotes && (
                <p className="text-stone-600 dark:text-stone-300 italic line-clamp-2">
                  "{hoveredEntry.journalNotes}"
                </p>
              )}
            </div>
          </div>

          {/* Physical Activities & Protections details in hover card */}
          {((hoveredEntry.physicalActivities && hoveredEntry.physicalActivities.length > 0) ||
            (hoveredEntry.protectiveFactors && hoveredEntry.protectiveFactors.length > 0) ||
            hoveredEntry.whatHelpedNotes) && (
            <div className="pt-2 border-t border-stone-200 dark:border-stone-700/60 grid grid-cols-1 md:grid-cols-2 gap-2">
              {hoveredEntry.physicalActivities && hoveredEntry.physicalActivities.length > 0 && (
                <div className="flex items-start gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-emerald-900 dark:text-emerald-200">Atividade Física:</strong>{' '}
                    {hoveredEntry.physicalActivities.map((pa, idx) => (
                      <span key={idx}>
                        {pa.type} ({pa.durationMinutes}min · {pa.intensity === 'light' ? 'Leve' : pa.intensity === 'moderate' ? 'Moderada' : 'Intensa'})
                        {pa.postWorkoutFeeling && ` - ${pa.postWorkoutFeeling}`}
                        {idx < hoveredEntry.physicalActivities!.length - 1 ? '; ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {((hoveredEntry.protectiveFactors && hoveredEntry.protectiveFactors.length > 0) || hoveredEntry.whatHelpedNotes) && (
                <div className="flex items-start gap-1.5 text-teal-800 dark:text-teal-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-teal-900 dark:text-teal-200">O Que Ajudou / Proteção:</strong>{' '}
                    {hoveredEntry.protectiveFactors?.join(', ')}
                    {hoveredEntry.whatHelpedNotes && (
                      <span className="italic block mt-0.5 text-stone-600 dark:text-stone-300">
                        "{hoveredEntry.whatHelpedNotes}"
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-stone-400 gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            +1 a +3 Energia Alta / Disposição
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            0 Equilibrado / Calmo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            -1 a -3 Energia Baixa / Desânimo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 border-dashed border border-rose-500 rounded-full inline-block" />
            Agitado + Cansado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t-2 border-dashed border-sky-500 inline-block" />
            Sono (horas)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rotate-45 bg-rose-500 inline-block" />
            Impulso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            Atividade Física
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
            Proteção / O que ajudou
          </span>
          {showBaseline && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-violet-500 inline-block" />
              Sua Média ({personalBaseline > 0 ? `+${personalBaseline.toFixed(1)}` : personalBaseline.toFixed(1)})
            </span>
          )}
          {showMovingAverage && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" />
              Tendência ({movingAverageDays}d)
            </span>
          )}
        </div>
        <span className="text-[11px] text-stone-400">
          Clique em qualquer ponto para ver o registro completo
        </span>
      </div>
    </div>
  );
};
