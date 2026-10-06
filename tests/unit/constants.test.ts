import { describe, expect, it } from 'vitest';
import { APP_NAME, DISCLAIMER, PERIOD_OPTIONS } from '@/core/constants';

describe('PERIOD_OPTIONS', () => {
  it('oferece os períodos 7, 14, 30 dias e o histórico completo', () => {
    expect(PERIOD_OPTIONS.map((option) => option.days)).toEqual([7, 14, 30, null]);
  });

  it('possui rótulos únicos e não vazios', () => {
    const labels = PERIOD_OPTIONS.map((option) => option.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const label of labels) expect(label.trim().length).toBeGreaterThan(0);
  });
});

describe('constantes de produto', () => {
  it('mantém o nome do aplicativo', () => {
    expect(APP_NAME).toBe('Afetivo');
  });

  it('mantém o aviso legal de não substituir avaliação profissional', () => {
    expect(DISCLAIMER).toMatch(/não substitui avaliação profissional/i);
  });
});
