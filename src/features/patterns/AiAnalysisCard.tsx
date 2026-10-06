import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { runAiAnalysis, type AiAnalysisRequest, type AiAnalysisResult } from '@/data/ai';

export interface AiAnalysisCardProps {
  request: AiAnalysisRequest;
}

type CardState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; result: AiAnalysisResult }
  | { kind: 'error'; message: string };

const FALLBACK_NOTICES: Record<NonNullable<AiAnalysisResult['fallback']>, string> = {
  not_configured: 'IA não configurada no servidor — exibindo a análise local.',
  remote_failed: 'IA indisponível no momento — exibindo a análise local.',
};

/**
 * Análise opcional com IA: nenhuma chamada acontece até o clique, e o
 * payload é só de agregados. Sem endpoint, a descrição local é exibida com
 * o aviso de que a IA ainda não está configurada.
 */
export function AiAnalysisCard({ request }: AiAnalysisCardProps) {
  const [state, setState] = useState<CardState>({ kind: 'idle' });

  async function handleGenerate(): Promise<void> {
    setState({ kind: 'loading' });
    try {
      const result = await runAiAnalysis(request);
      setState({ kind: 'done', result });
    } catch {
      setState({
        kind: 'error',
        message: 'Não foi possível gerar a análise agora. Tente novamente.',
      });
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Análise com IA (opcional)</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Nada é enviado até você clicar, e só agregados — contagens, médias e tags, sem suas notas.
        Sem chave no servidor, a análise local é usada no lugar.
      </p>

      <Button
        onClick={handleGenerate}
        loading={state.kind === 'loading'}
        className="mt-4"
        aria-describedby="aviso-ia"
      >
        {state.kind === 'loading' ? 'Gerando análise…' : 'Gerar análise'}
      </Button>

      {state.kind === 'done' && (
        <div role="status" className="mt-4 space-y-2">
          <p className="text-xs text-ink-muted">
            Provedor: {state.result.providerLabel}
            {state.result.fallback && ` — ${FALLBACK_NOTICES[state.result.fallback]}`}
          </p>
          <div className="whitespace-pre-line rounded-2xl border border-edge bg-panel-2 p-4 text-sm">
            {state.result.text}
          </div>
        </div>
      )}

      {state.kind === 'error' && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {state.message}
        </p>
      )}

      <p id="aviso-ia" className="mt-4 text-xs text-ink-muted">
        Leitura descritiva dos seus registros — não é diagnóstico, prognóstico nem recomendação de
        medicação.
      </p>
    </Card>
  );
}
