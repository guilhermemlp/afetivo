import { describe, expect, it } from 'vitest';
import {
  LEGACY_MOOD_LABELS,
  MOOD_NOT_INFORMED,
  VALENCE_LABELS,
  moodLabel,
  moodZone,
} from '@/core/mood';

describe('moodLabel', () => {
  it('usa os rótulos da escala valence', () => {
    expect(moodLabel({ moodScore: 2, moodScale: 'valence' })).toBe(VALENCE_LABELS[2]);
    expect(moodLabel({ moodScore: -3, moodScale: 'valence' })).toBe('Muito desagradável');
  });

  it('usa os rótulos da escala legada para registros antigos', () => {
    expect(moodLabel({ moodScore: 0, moodScale: 'legacy' })).toBe('Equilibrado / Neutro');
    expect(moodLabel({ moodScore: -1, moodScale: 'legacy' })).toBe('Levemente Desanimado');
  });

  it('trata escala ausente como legada (comportamento do v1)', () => {
    expect(moodLabel({ moodScore: 0, moodScale: null })).toBe(LEGACY_MOOD_LABELS[0]);
  });

  it('responde "Não informado" sem nota', () => {
    expect(moodLabel({ moodScore: null, moodScale: 'valence' })).toBe(MOOD_NOT_INFORMED);
    expect(moodLabel({ moodScore: undefined })).toBe(MOOD_NOT_INFORMED);
  });
});

describe('moodZone', () => {
  it('classifica a faixa de humor', () => {
    expect(moodZone(3)).toBe('elevado');
    expect(moodZone(1)).toBe('elevado');
    expect(moodZone(0)).toBe('equilibrado');
    expect(moodZone(-1)).toBe('baixo');
    expect(moodZone(-3)).toBe('baixo');
    expect(moodZone(null)).toBeNull();
  });
});
