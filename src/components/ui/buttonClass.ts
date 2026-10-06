export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-brand-ink hover:opacity-90',
  secondary: 'border border-edge bg-panel text-ink hover:bg-panel-2',
  ghost: 'text-ink-muted hover:bg-panel-2 hover:text-ink',
  danger: 'border border-danger/50 bg-panel text-danger hover:bg-danger/10',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 text-sm',
  md: 'min-h-12 px-4 text-sm font-medium',
};

/** Classes de botão reutilizáveis (ex.: links estilizados como botão). */
export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return [
    'inline-flex items-center justify-center gap-2 rounded-xl transition-opacity',
    'disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}
