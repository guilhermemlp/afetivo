import React from 'react';
import { useModalFocus } from '../hooks/useModalFocus';
import { X } from 'lucide-react';
export const PlanningGuideModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const modalRef = useModalFocus(onClose);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
      <section
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        className="bg-white dark:bg-stone-900 rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-5"
      >
        <header className="flex justify-between items-center">
          <h2 id="guide-title" className="font-semibold text-lg">
            Guia de Registro & Leitura dos Dados
          </h2>
          <button aria-label="Fechar guia" onClick={onClose}>
            <X />
          </button>
        </header>
        <p>
          Um diário para acompanhar humor e emoções, com um fluxo pensado para
          facilitar o uso por pessoas com TDAH.
        </p>
        <div className="space-y-2">
          <h3 className="font-semibold">Comece pequeno</h3>
          <p>
            Registre como se sente e quanta ativação percebe. Se quiser,
            acrescente contexto ou uma nota. Pode salvar sem responder tudo, sem
            escrever e sem completar uma sequência de dias.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Humor e ativação são diferentes</h3>
          <p>
            Você pode estar agradável e pouco ativado, ou desagradável e muito
            ativado. “Neutro” não quer dizer calma. A energia física é um
            detalhe opcional separado.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Momentos e resumo do dia</h3>
          <p>
            Um momento descreve como você se percebe naquele horário. Um resumo
            do dia é uma lembrança mais ampla. Você pode guardar vários
            registros no mesmo dia, sem substituir o anterior.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Contexto sem julgamento</h3>
          <p>
            Começar ou trocar de tarefa, interrupções e muitos estímulos podem
            ser contextos úteis para você observar. As opções são lembretes, não
            uma lista de sintomas. Emoções desagradáveis e realizar uma ação
            impulsiva não são fracassos.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Como ler os dados</h3>
          <p>
            Perguntas sem resposta permanecem sem resposta. O sistema mostra
            quantos registros e dias sustentam o resumo. Repetir um contexto não
            prova uma causa. Sono e atividade física podem compor o contexto,
            sem uma conclusão automática sobre seus efeitos.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Guarde o que fez sentido</h3>
          <p>
            Se quiser, anote um apoio ou estratégia escolhida por você e avalie
            se ajudou, ajudou em parte, não ajudou ou se ainda não sabe.
            Frequência de uso não significa que funcionou.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Retome quando quiser</h3>
          <p>
            Não precisa recuperar dias esquecidos. Você pode fazer um novo
            registro breve. Se escrever aumentar a sobrecarga, pode parar ou
            usar apenas as duas perguntas iniciais.
          </p>
        </div>
        <p className="text-sm text-stone-500">
          Os registros antigos mantêm sua escala original e ficam separados da
          nova. As escalas pessoais não são questionários clínicos. Seus
          registros ficam neste navegador; faça backup se quiser guardá-los em
          outro lugar.
        </p>
        <button
          className="bg-teal-800 text-white rounded-lg px-4 py-2"
          onClick={onClose}
        >
          Entendido, começar a usar
        </button>
      </section>
    </div>
  );
};
