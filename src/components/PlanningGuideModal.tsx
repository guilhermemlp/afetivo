import React from 'react';
import { X, BookOpen, Clock, Zap, Activity, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const PlanningGuideModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>Fundamentação & Método</span>
                <span aria-hidden="true">·</span>
                <span>Análise de Emoções & Hábitos</span>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                Guia de Registro & Análise de Padrões Emocionais
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
        <div className="overflow-y-auto p-6 space-y-6 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
          {/* Section 1: Philosophy */}
          <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/60">
            <h4 className="font-semibold text-teal-900 dark:text-teal-200 text-sm mb-1.5">
              Foco em Padrões e Autoconhecimento (Sem Diagnósticos)
            </h4>
            <p>
              O objetivo deste sistema não é rotular ou emitir diagnósticos médicos. O foco é observar fatos: como suas horas de sono, atividades e acontecimentos do dia a dia influenciam sua energia, seu humor e suas reações impulsivas, permitindo que você teste ajustes práticos de estratégia e rotina.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px] font-medium text-teal-900 dark:text-teal-200">
              <div className="bg-white/80 dark:bg-stone-800/80 p-2 rounded-lg text-center">
                1. Mapa de Humor (-3 a +3)
              </div>
              <div className="bg-white/80 dark:bg-stone-800/80 p-2 rounded-lg text-center">
                2. Noites de Sono
              </div>
              <div className="bg-white/80 dark:bg-stone-800/80 p-2 rounded-lg text-center">
                3. Impulsos & Fissuras
              </div>
              <div className="bg-white/80 dark:bg-stone-800/80 p-2 rounded-lg text-center">
                4. Mudança de Estratégia
              </div>
            </div>
          </div>

          {/* Section 2: Mood Chart */}
          <div className="space-y-2">
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Como Funciona o Mapa do Humor</span>
            </h4>
            <p>
              Em vez de um vago "estou bem ou mal", quantificamos o humor em uma escala contínua com base no seu nível de energia e tranquilidade:
            </p>
            <ul className="space-y-1.5 pl-2">
              <li>
                <strong className="text-amber-700 dark:text-amber-400">+1 a +3 (Energia Alta & Aceleração):</strong> Mente muito ativa, disposição acima da média, otimismo, fala rápida ou sensação de pressa interna. É comum haver maior vulnerabilidade a compras por impulso ou excesso de tarefas.
              </li>
              <li>
                <strong className="text-emerald-700 dark:text-emerald-400">0 (Equilibrado / Calmo):</strong> Estado de clareza, serenidade e estabilidade. Reações proporcionais aos acontecimentos.
              </li>
              <li>
                <strong className="text-indigo-700 dark:text-indigo-400">-1 a -3 (Energia Baixa & Desânimo):</strong> Sensação de cansaço, lentidão para agir, menor motivação e necessidade de recarregar as energias.
              </li>
              <li>
                <strong className="text-rose-700 dark:text-rose-400">Agitação com Cansaço:</strong> Momentos em que a cabeça está agitada/acelerada, mas o corpo se sente esgotado ou triste. Identificar esses momentos ajuda a desacelerar antes de entrar em sobrecarga.
              </li>
            </ul>
          </div>

          {/* Section 3: Sleep */}
          <div className="space-y-2">
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>O Sono como Gatilho Principal</span>
            </h4>
            <p>
              As noites de sono são o fator mais previsível de oscilação emocional:
            </p>
            <p className="bg-stone-50 dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700">
              <strong>Padrão comum:</strong> Dormir pouco por 2 noites seguidas costuma aumentar a irritabilidade e a propensão a agir sem pensar no dia seguinte. Registrar o sono ajuda a comprovar esse ciclo com seus próprios dados.
            </p>
          </div>

          {/* Section 4: Impulses */}
          <div className="space-y-2">
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-rose-600" />
              <span>Controle de Impulsos e Compulsões</span>
            </h4>
            <p>
              Impulsos (como compras não planejadas, comer por ansiedade ou rolar telas sem parar) são respostas automáticas para aliviar um desconforto:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Registrar a intensidade da urgência (1 a 5).</li>
              <li>Testar a <strong>regra dos 15 minutos</strong>: adiar a ação por 15 minutos antes de decidir se vai comprar ou ceder.</li>
              <li>Anotar o que aconteceu antes (o gatilho) e o que sentiu depois (a reflexão).</li>
            </ul>
          </div>

          {/* Section 5: Proteções e o que ajudou */}
          <div className="space-y-2">
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Proteções & Âncoras: O Que Ajudou Você a Atravessar?</span>
            </h4>
            <p>
              Tão importante quanto mapear o que deu errado é registrar <strong>o que deu certo</strong>. Chamamos de "âncoras de proteção" todas as atitudes e apoios que te ajudaram a respirar, diminuir a sobrecarga ou conter um impulso:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Conversar com alguém de confiança ou desabafar.</li>
              <li>Fazer uma pausa e respirar fundo com calma.</li>
              <li>Caminhar ao ar livre ou estar em contato com a natureza.</li>
              <li>Afastar o celular e sair das redes sociais quando a cabeça estiver cheia.</li>
              <li>Ter momentos simples de autocuidado ou carinho com um pet.</li>
            </ul>
            <p className="text-stone-500 text-[11px] italic">
              Ao registrar suas proteções, o sistema acumula um repertório real das estratégias que mais funcionam para o seu próprio bem-estar.
            </p>
          </div>

          {/* Section 6: Atividade Física & Cruzamento com Humor */}
          <div className="space-y-2">
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Atividade Física: Cruzando Exercício com Humor</span>
            </h4>
            <p>
              Ao registrar práticas de exercício (como corrida, pilates, musculação, caminhada ou yoga), o sistema cruza automaticamente essas sessões com suas oscilações emocionais:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Permite comparar o <strong>humor médio</strong> nos dias em que você treinou versus dias sedentários.</li>
              <li>Calcula a redução real nos níveis de <strong>ansiedade e tensão muscular</strong>.</li>
              <li>Ajuda a encontrar a modalidade e a duração ideais para o seu equilíbrio físico e mental.</li>
            </ul>
          </div>

          {/* Section 7: Routine */}
          <div className="space-y-2 border-t border-stone-100 dark:border-stone-800 pt-4">
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Como Usar no Seu Dia a Dia</span>
            </h4>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>À noite (2 minutos):</strong> Abra o app, clique em "Novo Registro", marque sua nota de humor, as horas dormidas e anote um parágrafo sobre seu dia.
              </li>
              <li>
                <strong>Ao sentir um impulso:</strong> Abra o app e marque a ocorrência. Só o tempo de preencher o registro já quebra o automatismo do impulso.
              </li>
              <li>
                <strong>A cada semana ou mês:</strong> Veja a aba "Análise de Padrões & IA" para descobrir quais fatores geram mais oscilação e testar novas estratégias.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors cursor-pointer"
          >
            Entendido, começar a usar
          </button>
        </div>
      </div>
    </div>
  );
};
