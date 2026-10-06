import type { ReactNode } from 'react';

export interface ChoiceButtonProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Nome acessível quando difere do texto visível (ex.: "Ativação 3"). */
  ariaLabel?: string;
  className?: string;
}

/**
 * Opção alternável (escala, filtro, tag). `aria-pressed` espelha o estado —
 * mesma semântica do v1, alvo mínimo de 44px.
 */
export function ChoiceButton({
  selected,
  onClick,
  children,
  ariaLabel,
  className,
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        'min-h-11 rounded-xl border px-3 py-2 text-sm transition-colors',
        selected
          ? 'border-brand bg-brand font-medium text-brand-ink'
          : 'border-edge bg-panel text-ink hover:bg-panel-2',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}
