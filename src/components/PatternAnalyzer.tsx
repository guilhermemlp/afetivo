import React, { useState } from 'react';
import { AfetivoEntry } from '../types/mood';
import { analyzePatternsLocally } from '../services/analysisProvider';
interface Props {
  entries: AfetivoEntry[];
  onOpenReportModal: () => void;
}
export const PatternAnalyzer: React.FC<Props> = ({
  entries,
  onOpenReportModal,
}) => {
  const [days, setDays] = useState(30);
  const local = analyzePatternsLocally({
    entries,
    timeFrameDays: days,
  }).analysis;
  return (
    <section className="space-y-5">
      <h2 className="text-xl font-semibold">Seus registros em contexto</h2>
      <p>
        Resumo do que você informou. Você escolhe se quer explorar detalhes ou
        apenas guardar o registro.
      </p>
      <label>
        Período
        <select
          aria-label="Período da análise"
          className="border rounded-lg p-2 ml-2 bg-white dark:bg-stone-900"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          {[
            [7, "7 dias"],
            [14, "14 dias"],
            [30, "30 dias"],
            [0, "Todo o histórico"],
          ].map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="border rounded-xl p-4 space-y-3 bg-white dark:bg-stone-900">
        <h3 className="font-semibold">Cobertura dos registros</h3>
        <p>{local.resumo_geral}</p>
        <ul className="list-disc pl-5 space-y-2">
          {(local.patterns ?? []).map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
        <p className="text-sm">
          Dias sem registro e perguntas puladas não são tratados como humor
          neutro ou ausência de acontecimentos.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border rounded-xl p-4 space-y-2 bg-white dark:bg-stone-900">
          <h3 className="font-semibold">Contextos relatados</h3>
          {local.gatilhos_mais_frequentes.length ? (
            <ul className="space-y-2">
              {local.gatilhos_mais_frequentes.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          ) : (
            <p>Nenhum contexto informado.</p>
          )}
          <p className="text-sm text-stone-500">
            Frequência não comprova causa.
          </p>
        </div>
        <div className="border rounded-xl p-4 space-y-2 bg-white dark:bg-stone-900">
          <h3 className="font-semibold">Apoios avaliados por você</h3>
          {local.protecoes_mais_eficazes.length ? (
            <ul className="space-y-2">
              {local.protecoes_mais_eficazes.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          ) : (
            <p>Ainda não há apoios com avaliação explícita de ajuda.</p>
          )}
          <p className="text-sm text-stone-500">
            Inclui “ajudou” e “ajudou em parte”. A frequência de uso, sozinha,
            não indica eficácia.
          </p>
        </div>
      </div>
      <p className="text-sm">{local.observacao_exercicio}</p>
      <button
        className="bg-teal-800 text-white px-4 py-2 rounded-lg"
        onClick={onOpenReportModal}
      >
        Gerar Relatório Completo
      </button>
      <div className="border rounded-xl p-4 space-y-2 bg-teal-50/50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900">
        <h3 className="font-semibold">Análise local e privada</h3>
        <p className="text-sm">
          Este resumo é calculado neste dispositivo, sem IA, sem chave e sem
          enviar seus registros a um servidor. Uma integração futura poderá usar
          outro provedor por meio de um adaptador opcional e explícito.
        </p>
      </div>
      <p className="text-sm text-stone-500">
        Sem pontuação de estabilidade ou obrigação de registrar todos os dias.
        Dados fictícios ficam fora desta análise.
      </p>
    </section>
  );
};
