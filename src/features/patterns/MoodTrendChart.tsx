import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DayPoint } from '@/core/analysis';
import { formatDateBR } from '@/core/dates';
import { Card } from '@/components/ui';

type TrendKind = 'mood' | 'activation';

interface TrendConfig {
  title: string;
  description: string;
  dataKey: 'moodAvg' | 'activationAvg';
  label: string;
  domain: [number, number];
  ticks: number[];
  stroke: string;
  responsesLabel: string;
}

const CONFIG: Record<TrendKind, TrendConfig> = {
  mood: {
    title: 'Humor ao longo do período',
    description:
      'Média diária de quem respondeu, de −3 (desagradável) a +3 (agradável). Dia sem resposta fica em branco — a linha nunca infere valores entre lacunas.',
    dataKey: 'moodAvg',
    label: 'Humor médio',
    domain: [-3, 3],
    ticks: [-3, -2, -1, 0, 1, 2, 3],
    stroke: '#0d9488',
    responsesLabel: 'Humor médio',
  },
  activation: {
    title: 'Ativação ao longo do período',
    description:
      'Média diária da ativação, de 1 (pouca) a 5 (muita). “Neutro” no humor não significa calmo — os gráficos são separados de propósito.',
    dataKey: 'activationAvg',
    label: 'Ativação média',
    domain: [1, 5],
    ticks: [1, 2, 3, 4, 5],
    stroke: '#7c3aed',
    responsesLabel: 'Ativação média',
  },
};

function shortDate(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

export interface MoodTrendChartProps {
  points: DayPoint[];
  kind: TrendKind;
}

/** Linha diária com lacunas reais (`null`) e tabela textual acessível. */
export function MoodTrendChart({ points, kind }: MoodTrendChartProps) {
  const config = CONFIG[kind];
  const withData = points.filter((point) => point[config.dataKey] != null);

  return (
    <Card>
      <h2 className="text-lg font-semibold">{config.title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{config.description}</p>

      {withData.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">
          Nenhuma resposta no período — escolha outro período acima.
        </p>
      ) : (
        <>
          <div
            role="img"
            aria-label={`${config.title}: ${withData.length} dias com resposta no período`}
            className="mt-3 h-64 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.35} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => shortDate(value)}
                  tick={{ fontSize: 11 }}
                  minTickGap={28}
                  stroke="#64748b"
                />
                <YAxis
                  domain={config.domain}
                  ticks={config.ticks}
                  tick={{ fontSize: 11 }}
                  width={40}
                  stroke="#64748b"
                />
                <Tooltip
                  labelFormatter={(label) => formatDateBR(String(label))}
                  formatter={(value) => [String(value ?? '—'), config.label]}
                />
                <Line
                  type="monotone"
                  dataKey={config.dataKey}
                  name={config.label}
                  stroke={config.stroke}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-ink-muted">
              Ver valores ({withData.length} dias com resposta)
            </summary>
            <div className="max-h-56 overflow-y-auto pt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-muted">
                    <th scope="col" className="py-1 pr-3 font-medium">
                      Dia
                    </th>
                    <th scope="col" className="py-1 pr-3 font-medium">
                      Registros
                    </th>
                    <th scope="col" className="py-1 font-medium">
                      {config.responsesLabel}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((point) => (
                    <tr key={point.date} className="border-t border-edge">
                      <td className="py-1 pr-3 tabular-nums">{formatDateBR(point.date)}</td>
                      <td className="py-1 pr-3 tabular-nums">{point.entryCount}</td>
                      <td className="py-1 tabular-nums">{point[config.dataKey] ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </Card>
  );
}
