import React, { useState } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { AfetivoEntry } from "../types/mood";
import {
  moodLabel,
  impulseLabel,
  EFFECT_LABELS,
} from "../services/observations";
interface Props {
  entries: AfetivoEntry[];
  onEditEntry: (entry: AfetivoEntry) => void;
  onDeleteEntry: (id: string) => void;
}
export const JournalFeed: React.FC<Props> = ({
  entries,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [search, setSearch] = useState(""),
    [kind, setKind] = useState("all");
  const filtered = [...entries]
    .filter(
      (e) =>
        (kind === "all" ||
          e.recordKind === kind ||
          (kind === "demo" && e.isDemo) ||
          (kind === "legacy" && !e.recordKind)) &&
        [
          e.journalNotes,
          e.moodLabel,
          ...(e.emotions ?? []),
          ...(e.contexts ?? []),
          ...(e.customTags ?? []),
          ...(e.triggers ?? []),
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")),
    )
    .sort(
      (a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
    );
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Diário & Histórico</h2>
      <p>
        Você pode registrar mais de um momento por dia. Cada registro fica
        guardado separadamente.
      </p>
      <div className="flex flex-wrap gap-3">
        <label className="flex-1">
          Buscar nos registros
          <input
            aria-label="Buscar nos registros"
            className="border rounded-lg p-2 w-full bg-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Tipo
          <select
            aria-label="Filtrar tipo de registro"
            className="block border rounded-lg p-2 bg-white dark:bg-stone-900"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="moment">Momentos</option>
            <option value="daily_summary">Resumos do dia</option>
            <option value="legacy">Antigos, sem tipo definido</option>
            <option value="demo">Demonstração</option>
          </select>
        </label>
      </div>
      <p className="text-sm text-stone-500">
        {filtered.length} registros em{" "}
        {new Set(filtered.map((e) => e.date)).size} dias neste filtro.
      </p>
      {filtered.map((e) => (
        <article
          key={e.id}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-3"
        >
          <div className="flex justify-between gap-3">
            <div>
              <h3 className="font-semibold">
                {e.date.split("-").reverse().join("/")} · {e.time}
              </h3>
              <p className="text-sm text-stone-500">
                {e.recordKind === "moment"
                  ? "Momento"
                  : e.recordKind === "daily_summary"
                    ? "Resumo do dia"
                    : "Registro antigo, sem tipo definido"}
                {e.isDemo ? " · Exemplo fictício" : ""}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                title="Editar registro"
                aria-label={`Editar registro ${e.date} ${e.time}`}
                onClick={() => onEditEntry(e)}
              >
                <Edit3 size={18} />
              </button>
              <button
                title="Excluir registro"
                aria-label={`Excluir registro ${e.date} ${e.time}`}
                onClick={() => onDeleteEntry(e.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <p>
            <strong>Humor:</strong> {moodLabel(e)}{" "}
            <span className="text-sm text-stone-500">
              (
              {e.moodScale === "valence"
                ? "agradável/desagradável"
                : "escala antiga"}
              )
            </span>
          </p>
          <p>
            <strong>Ativação:</strong>{" "}
            {e.activationLevel == null
              ? "Não informada"
              : `${e.activationLevel}/5`}{" "}
            · <strong>Sono:</strong>{" "}
            {e.sleepHours == null ? "Não informado" : `${e.sleepHours}h`}
          </p>
          {!!e.emotions.length && (
            <p>
              <strong>Emoções:</strong> {e.emotions.join(", ")}
            </p>
          )}
          {!!e.contexts?.length && (
            <p>
              <strong>Contexto:</strong> {e.contexts.join(", ")}
            </p>
          )}
          {!!e.triggers.length && (
            <p>
              <strong>Contexto informado anteriormente:</strong>{" "}
              {e.triggers.join(", ")}
            </p>
          )}
          <p>
            <strong>Impulsos:</strong>{" "}
            {e.impulsiveBehaviors.length
              ? e.impulsiveBehaviors
                  .map(
                    (i) => `${i.type || "Sem descrição"} — ${impulseLabel(i)}`,
                  )
                  .join("; ")
              : e.observedSections?.includes("impulses")
                ? "Não percebi impulsos (resposta explícita)"
                : "Não informados"}
          </p>
          {!!e.physicalActivities?.length && (
            <p>
              <strong>Atividade:</strong>{" "}
              {e.physicalActivities
                .map(
                  (w) =>
                    `${w.type || "Sem descrição"} · ${w.durationMinutes ?? "duração não informada"}${w.durationMinutes == null ? "" : " min"}`,
                )
                .join("; ")}
            </p>
          )}
          {e.whatHelpedNotes && (
            <p>
              <strong>Apoio:</strong> {e.whatHelpedNotes}
            </p>
          )}
          {e.strategyEffect && (
            <p>
              <strong>Avaliação do apoio:</strong>{" "}
              {EFFECT_LABELS[e.strategyEffect]}
            </p>
          )}
          {e.nextStep && (
            <p>
              <strong>Próximo passo escolhido:</strong> {e.nextStep}
            </p>
          )}
          {e.journalNotes && (
            <p className="whitespace-pre-wrap">{e.journalNotes}</p>
          )}
          {!!e.customTags?.length && (
            <p className="text-sm text-teal-700">{e.customTags.join(" ")}</p>
          )}
          {!!e.medicationIntakes.length && (
            <p className="text-sm">
              Medicações/rotina:{" "}
              {e.medicationIntakes
                .map(
                  (m) =>
                    `${m.medicationName}: ${{ taken: "Tomado / realizado", skipped: "Não tomado / realizado", delayed: "Atrasado", extra_dose: "Dose adicional registrada" }[m.status]}`,
                )
                .join("; ")}
            </p>
          )}
        </article>
      ))}
      {!filtered.length && (
        <p className="p-6 bg-white dark:bg-stone-900 rounded-xl">
          Nenhum registro neste filtro. Você pode começar ou retomar quando
          quiser.
        </p>
      )}
    </section>
  );
};
