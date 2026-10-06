import { describe, expect, it, beforeEach } from 'vitest';
import { appEnv, parseAppEnv, resetAppEnv } from '@/core/env';

const VALID = {
  VITE_SUPABASE_URL: 'https://demo.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'anon-key-demo',
};

describe('parseAppEnv', () => {
  it('habilita o remoto com url e anon key juntas', () => {
    const env = parseAppEnv(VALID);

    expect(env.remoteEnabled).toBe(true);
    expect(env.supabaseUrl).toBe('https://demo.supabase.co');
    expect(env.supabaseAnonKey).toBe('anon-key-demo');
    expect(env.issues).toEqual([]);
  });

  it('fica local (sem erro fatal) quando falta uma das duas chaves', () => {
    const onlyUrl = parseAppEnv({ VITE_SUPABASE_URL: VALID.VITE_SUPABASE_URL });
    expect(onlyUrl.remoteEnabled).toBe(false);
    expect(onlyUrl.issues).toHaveLength(1);
    expect(onlyUrl.issues[0]).toContain('juntas');

    const onlyKey = parseAppEnv({ VITE_SUPABASE_ANON_KEY: VALID.VITE_SUPABASE_ANON_KEY });
    expect(onlyKey.remoteEnabled).toBe(false);
    expect(onlyKey.issues).toHaveLength(1);
  });

  it('rejeita url malformada listando o problema', () => {
    const env = parseAppEnv({ ...VALID, VITE_SUPABASE_URL: 'nao-e-url' });

    expect(env.remoteEnabled).toBe(false);
    expect(env.issues.some((issue) => issue.includes('URL'))).toBe(true);
  });

  it('começa 100% local sem nenhuma variável', () => {
    const env = parseAppEnv({});

    expect(env.remoteEnabled).toBe(false);
    expect(env.supabaseUrl).toBeNull();
    expect(env.aiAnalysisUrl).toBeNull();
    expect(env.issues).toEqual([]);
  });

  it('aceita o endpoint opcional de análise com IA', () => {
    const env = parseAppEnv({
      VITE_AI_ANALYSIS_URL: 'https://demo.supabase.co/functions/v1/ai-analysis',
    });

    expect(env.aiAnalysisUrl).toBe('https://demo.supabase.co/functions/v1/ai-analysis');
    expect(env.issues).toEqual([]);
  });

  it('endpoint de IA malformado vira issue e fica nulo', () => {
    const env = parseAppEnv({ VITE_AI_ANALYSIS_URL: 'nao-e-url' });

    expect(env.aiAnalysisUrl).toBeNull();
    expect(env.issues.some((issue) => issue.includes('VITE_AI_ANALYSIS_URL'))).toBe(true);
  });

  it('trata valor vazio como ausente', () => {
    const env = parseAppEnv({ VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' });

    expect(env.remoteEnabled).toBe(false);
    expect(env.issues).toEqual([]);
  });
});

describe('appEnv', () => {
  beforeEach(() => resetAppEnv());

  it('memoiza a primeira leitura', () => {
    resetAppEnv();
    const first = appEnv(VALID);
    const second = appEnv({});

    expect(second).toBe(first);
    expect(second.remoteEnabled).toBe(true);
  });

  it('resetAppEnv força nova leitura', () => {
    resetAppEnv();
    expect(appEnv(VALID).remoteEnabled).toBe(true);

    resetAppEnv();
    expect(appEnv({}).remoteEnabled).toBe(false);
  });
});
