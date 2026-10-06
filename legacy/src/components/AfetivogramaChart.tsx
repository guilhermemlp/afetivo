import React, { useState } from "react";
import { AfetivoEntry } from "../types/mood";
import { entriesInPeriod } from "../services/dates";
import { moodLabel } from "../services/observations";
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
  const [scale, setScale] = useState<"valence" | "legacy">("valence");
  const [includeDemo, setIncludeDemo] = useState(false);
  const sorted = entriesInPeriod(entries, timeFrameDays).filter(
    (e) =>
      (includeDemo || !e.isDemo) &&
      (scale === "valence"
        ? e.moodScale === "valence"
        : e.moodScale !== "valence"),
  );
  const width = 800,
    height = 220;
  const times = sorted.map((e) => new Date(`${e.date}T${e.time}`).getTime());
  const first = Math.min(...times),
    span = Math.max(...times) - first;
  const x = (index: number) =>
    sorted.length === 1 || !span
      ? 400
      : 55 + ((times[index] - first) / span) * 705;
  const y = (value: number, activation: boolean) =>
    185 - (activation ? (value - 1) / 4 : (value + 3) / 6) * 150;
  return (
    <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-semibold">Registros ao longo do tempo</h2>
        <label>
          Escala
          <select
            aria-label="Escala do gráfico"
            className="border rounded-lg p-2 bg-white dark:bg-stone-900 ml-2"
            value={scale}
            onChange={(e) => setScale(e.target.value as typeof scale)}
          >
            <option value="valence">Humor e ativação separados</option>
            <option value="legacy">Escala antiga</option>
          </select>
        </label>
        {entries.some((e) => e.isDemo) && (
          <label className="text-sm">
            <input
              type="checkbox"
              checked={includeDemo}
              onChange={(e) => setIncludeDemo(e.target.checked)}
            />{" "}
            Mostrar exemplos fictícios
          </label>
        )}
      </div>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        {scale === "valence"
          ? "Humor indica agradável/desagradável. Ativação indica pouco/muito ativado. Neutro não significa calmo."
          : "Registros antigos mantêm sua escala original, que reunia humor e energia. Não são comparados à nova escala."}{" "}
        Momentos e resumos do dia aparecem como pontos distintos; sem respostas,
        não há ponto.
      </p>
      {!sorted.length ? (
        <p className="py-8 text-center">
          Nenhum registro nesta escala e neste período.
        </p>
      ) : (
        <div className="space-y-4">
          {(
            [
              "moodScore",
              ...(scale === "valence" ? ["activationLevel"] : []),
            ] as ("moodScore" | "activationLevel")[]
          ).map((key) => (
            <div key={key}>
              <h3 className="text-sm font-medium">
                {key === "moodScore"
                  ? scale === "valence"
                    ? "Humor: desagradável (−3) a agradável (+3)"
                    : "Humor na escala antiga (−3 a +3)"
                  : "Ativação: pouca (1) a muita (5)"}
              </h3>
              <svg
                role="img"
                aria-label={
                  key === "moodScore"
                    ? "Pontos de humor por data e horário"
                    : "Pontos de ativação por data e horário"
                }
                viewBox={`0 0 ${width} ${height}`}
                className="w-full"
              >
                <title>
                  Registros por data e horário, sem inferir valores nas lacunas
                </title>
                {(key === "moodScore" ? [-3, 0, 3] : [1, 3, 5]).map((n) => (
                  <g key={n}>
                    <line
                      x1="50"
                      x2="770"
                      y1={y(n, key === "activationLevel")}
                      y2={y(n, key === "activationLevel")}
                      stroke="currentColor"
                      opacity="0.15"
                    />
                    <text
                      x="22"
                      y={y(n, key === "activationLevel") + 5}
                      fill="currentColor"
                      fontSize="14"
                    >
                      {n}
                    </text>
                  </g>
                ))}
                {sorted.map((e, i) =>
                  e[key] == null ? null : (
                    <circle
                      key={e.id}
                      cx={x(i)}
                      cy={y(e[key], key === "activationLevel")}
                      r={e.recordKind === "daily_summary" ? 7 : 4}
                      fill={
                        e.isDemo
                          ? "#a16207"
                          : key === "moodScore"
                            ? "#0f766e"
                            : "#7c3aed"
                      }
                    >
                      <title>
                        {e.date} {e.time} —{" "}
                        {e.recordKind === "daily_summary"
                          ? "Resumo do dia"
                          : "Momento / registro antigo"}
                        :{" "}
                        {key === "moodScore" ? moodLabel(e) : e.activationLevel}
                      </title>
                    </circle>
                  ),
                )}
                <text x="55" y="212" fill="currentColor" fontSize="13">
                  {sorted[0].date}
                </text>
                <text
                  x="760"
                  y="212"
                  textAnchor="end"
                  fill="currentColor"
                  fontSize="13"
                >
                  {sorted[sorted.length - 1].date}
                </text>
              </svg>
              <p className="text-xs text-stone-500">
                {sorted.filter((e) => e[key] != null).length} respostas;{" "}
                {sorted.filter((e) => e[key] == null).length} sem resposta.
                Pontos maiores: resumos do dia.
              </p>
            </div>
          ))}
          <details>
            <summary className="cursor-pointer">
              Ver valores e abrir registros ({sorted.length})
            </summary>
            <ul className="space-y-2 py-3">
              {sorted.map((e) => (
                <li key={e.id}>
                  <button
                    className="text-left underline"
                    onClick={() => onSelectEntry?.(e)}
                  >
                    {e.date} {e.time} ·{" "}
                    {e.recordKind === "daily_summary"
                      ? "Resumo do dia"
                      : e.recordKind === "moment"
                        ? "Momento"
                        : "Registro antigo"}{" "}
                    · {moodLabel(e)} · Ativação:{" "}
                    {e.activationLevel ?? "não informada"}
                    {e.isDemo ? " · Exemplo fictício" : ""}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </section>
  );
};
