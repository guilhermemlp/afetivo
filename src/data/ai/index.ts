import { appEnv } from '@/core/env';
import { localAiProvider } from './localProvider';
import { createRemoteAiProvider } from './remoteProvider';
import { AiAnalysisError, type AiAnalysisRequest, type AiAnalysisResult } from './types';

export { describePeriod, localAiProvider } from './localProvider';
export { createRemoteAiProvider } from './remoteProvider';
export {
  AiAnalysisError,
  type AiAnalysisProvider,
  type AiAnalysisRequest,
  type AiAnalysisResult,
} from './types';

/**
 * Executa a análise: tenta o provedor remoto quando houver endpoint e cai
 * para a descrição local em qualquer falha (`fallback` explica o motivo).
 * Só há chamada externa quando o usuário aciona o botão na tela.
 */
export async function runAiAnalysis(request: AiAnalysisRequest): Promise<AiAnalysisResult> {
  const endpoint = appEnv().aiAnalysisUrl;
  if (endpoint) {
    try {
      return await createRemoteAiProvider(endpoint).analyze(request);
    } catch (error) {
      const fallback =
        error instanceof AiAnalysisError && error.kind === 'not_configured'
          ? ('not_configured' as const)
          : ('remote_failed' as const);
      return { ...(await localAiProvider.analyze(request)), fallback };
    }
  }
  return { ...(await localAiProvider.analyze(request)), fallback: 'not_configured' as const };
}
