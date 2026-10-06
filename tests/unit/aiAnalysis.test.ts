import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { periodStats, topTags } from '@/core/analysis';
import { dateRange } from '@/core/dates';
import { appEnv, resetAppEnv } from '@/core/env';
import { createBlankEntry, withUpdates } from '@/core/entry';
import {
  AiAnalysisError,
  createRemoteAiProvider,
  describePeriod,
  localAiProvider,
  runAiAnalysis,
  type AiAnalysisRequest,
} from '@/data/ai';

function emptyRequest(): AiAnalysisRequest {
  const range = dateRange(7, new Date(2026, 9, 10, 12, 0));
  return {
    periodDays: 7,
    periodLabel: '7 dias',
    stats: periodStats([], [], range),
    tags: [],
  };
}

function requestWithEntries(): AiAnalysisRequest {
  const range = dateRange(7, new Date(2026, 9, 10, 12, 0));
  const entry = withUpdates(
    createBlankEntry(new Date(2026, 9, 9, 10, 0)),
    { moodScore: 2, tags: [{ kind: 'trigger' as const, label: 'sono ruim' }] },
    1,
  );
  return {
    periodDays: 7,
    periodLabel: '7 dias',
    stats: periodStats([entry], [], range),
    tags: topTags([entry], range),
  };
}

describe('describePeriod (análise local)', () => {
  it('descreve só agregados reais e termina com o aviso', () => {
    const text = describePeriod(requestWithEntries());

    expect(text).toContain('Período analisado: 7 dias');
    expect(text).toContain('1 registro(s)');
    expect(text).toContain('Humor médio: 2');
    expect(text).toContain('sono ruim (1)');
    expect(text).toContain('não é diagnóstico nem recomendação de medicação');
  });

  it('sem dados, diz que não há respostas em vez de inventar zero', () => {
    const text = describePeriod(emptyRequest());

    expect(text).toContain('0 registro(s) em 0 dia(s) de 7 no período.');
    expect(text).toContain('não há respostas de humor neste período.');
    expect(text).toContain('não há dados de ativação neste período.');
    expect(text).toContain('Nenhuma tag registrada no período.');
  });
});

describe('runAiAnalysis', () => {
  beforeEach(() => {
    resetAppEnv();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetAppEnv();
  });

  it('sem endpoint configurado cai na análise local com aviso', async () => {
    const result = await runAiAnalysis(requestWithEntries());

    expect(result.providerId).toBe('local');
    expect(result.fallback).toBe('not_configured');
    expect(result.text).toContain('não é diagnóstico');
  });

  it('com endpoint usa o provedor remoto sem payload de textos', async () => {
    appEnv({ VITE_AI_ANALYSIS_URL: 'https://demo.supabase.co/functions/v1/ai-analysis' });

    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ providerLabel: 'IA de teste', text: 'Leitura gerada.' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = requestWithEntries();
    const result = await runAiAnalysis(request);

    expect(result.providerId).toBe('remote');
    expect(result.providerLabel).toBe('IA de teste');
    expect(result.text).toBe('Leitura gerada.');
    expect(result.fallback).toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
    expect(body).toHaveProperty('stats');
    expect(body).toHaveProperty('tags');
    expect(body).not.toHaveProperty('journalNotes');
    expect(JSON.stringify(body)).not.toContain('dia produtivo');
  });

  it('servidor sem IA configurada (501) volta para a análise local', async () => {
    appEnv({ VITE_AI_ANALYSIS_URL: 'https://demo.supabase.co/functions/v1/ai-analysis' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 501 })),
    );

    const result = await runAiAnalysis(emptyRequest());

    expect(result.providerId).toBe('local');
    expect(result.fallback).toBe('not_configured');
  });

  it('falha de rede também cai na análise local, com outro motivo', async () => {
    appEnv({ VITE_AI_ANALYSIS_URL: 'https://demo.supabase.co/functions/v1/ai-analysis' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );

    const result = await runAiAnalysis(emptyRequest());

    expect(result.providerId).toBe('local');
    expect(result.fallback).toBe('remote_failed');
  });
});

describe('createRemoteAiProvider', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rejeita resposta sem texto como invalid_response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ providerLabel: 'x' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    );

    const provider = createRemoteAiProvider('https://example.test/ai');
    await expect(provider.analyze(emptyRequest())).rejects.toMatchObject({
      kind: 'invalid_response',
    });
  });

  it('erro HTTP vira AiAnalysisError de rede', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('boom', { status: 500 })),
    );

    const provider = createRemoteAiProvider('https://example.test/ai');
    await expect(provider.analyze(emptyRequest())).rejects.toBeInstanceOf(AiAnalysisError);
  });
});

describe('localAiProvider', () => {
  it('devolve resultado identificado como local', async () => {
    const result = await localAiProvider.analyze(emptyRequest());
    expect(result.providerId).toBe('local');
    expect(result.providerLabel).toBe('Análise local');
    expect(result.generatedAt).toBeGreaterThan(0);
  });
});
