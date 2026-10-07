import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DayPoint } from '@/core/analysis';
import { formatDateBR } from '@/core/dates';
import { Card } from '@/components/ui';

function shortDate(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

export interface ImpulseBarChartProps {
  points: DayPoint[];
}

/**
 * Contagem diária de impulsos: dia sem registro = sem barra (nunca zero
 * implícito) e dia registrado sem impulso = barra zero.
 */
export function ImpulseBarChart({ points }: ImpulseBarChartProps) {
  const withData = points.filter((point) => point.impulseCount != null);
  const total = withData.reduce((sum, point) => sum + (point.impulseCount ?? 0), 0);

  return (
    <Card>
      <h2 className="text-lg font-semibold">Impulsos ao longo do período</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Total de impulsos registrados por dia. Dias sem registro não aparecem — a ausência de barra
        não significa zero.
      </p>

      {withData.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">
          Nenhum registro no período — escolha outro período acima.
        </p>
      ) : (
        <>
          <div
            role="img"
            aria-label={`Impulsos ao longo do período: ${total} impulsos em ${withData.length} dias com registro`}
            className="mt-3 h-64 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.35} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => shortDate(value)}
                  tick={{ fontSize: 11 }}
                  minTickGap={28}
                  stroke="#64748b"
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, 'dataMax']}
                  tick={{ fontSize: 11 }}
                  width={40}
                  stroke="#64748b"
                />
                <Tooltip
                  labelFormatter={(label) => formatDateBR(String(label))}
                  formatter={(value) => [String(value ?? '—'), 'Impulsos']}
                />
                <Bar
                  dataKey="impulseCount"
                  name="Impulsos"
                  fill="#e11d48"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-ink-muted">
              Ver valores ({withData.length} dias com registro)
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
                      Impulsos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((point) => (
                    <tr key={point.date} className="border-t border-edge">
                      <td className="py-1 pr-3 tabular-nums">{formatDateBR(point.date)}</td>
                      <td className="py-1 pr-3 tabular-nums">{point.entryCount}</td>
                      <td className="py-1 tabular-nums">{point.impulseCount ?? '—'}</td>
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
