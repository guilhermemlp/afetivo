import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DayPoint } from '@/core/analysis';
import { formatDateBR } from '@/core/dates';
import { Card } from '@/components/ui';

export interface MedsMoodTimelineProps {
  points: DayPoint[];
  /** Contagem de tomadas por dia (`YYYY-MM-DD` → total). */
  intakes: Map<string, number>;
}

function shortDate(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

/**
 * Timeline descritiva: humor médio (linha) e tomadas registradas (barras)
 * no mesmo eixo temporal. Nenhuma inferência causal — só o que foi registrado.
 */
export function MedsMoodTimeline({ points, intakes }: MedsMoodTimelineProps) {
  const data = points.map((point) => ({
    date: point.date,
    humor: point.moodAvg,
    tomadas: intakes.get(point.date) ?? 0,
  }));
  const hasMood = data.some((row) => row.humor != null);
  const hasIntakes = data.some((row) => row.tomadas > 0);
  if (!hasMood && !hasIntakes) return null;

  const maxTomadas = Math.max(1, ...data.map((row) => row.tomadas));

  return (
    <Card>
      <h2 className="text-lg font-semibold">Medicações × humor</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Tomadas registradas por dia ao lado do humor médio. Correlação não implica causa — observe e
        leve o registro ao seu profissional.
      </p>
      <div
        role="img"
        aria-label="Gráfico de humor médio e tomadas por dia"
        className="mt-3 h-64 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.35} />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => shortDate(value)}
              tick={{ fontSize: 11 }}
              minTickGap={28}
              stroke="#64748b"
            />
            <YAxis
              yAxisId="left"
              domain={[-3, 3]}
              ticks={[-3, -2, -1, 0, 1, 2, 3]}
              tick={{ fontSize: 11 }}
              width={40}
              stroke="#64748b"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, maxTomadas]}
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              width={32}
              stroke="#64748b"
            />
            <Tooltip labelFormatter={(label) => formatDateBR(String(label))} />
            <Legend />
            <Bar
              yAxisId="right"
              dataKey="tomadas"
              name="Tomadas"
              fill="#7c3aed"
              fillOpacity={0.4}
            />
            <Line
              yAxisId="left"
              dataKey="humor"
              name="Humor médio"
              stroke="#0d9488"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
