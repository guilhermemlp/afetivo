import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from './theme';

const LABELS = {
  system: 'Tema: seguindo o sistema',
  light: 'Tema: claro',
  dark: 'Tema: escuro',
} as const;

export function ThemeToggle() {
  const { preference, cycle } = useTheme();
  const Icon = preference === 'system' ? Monitor : preference === 'light' ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={LABELS[preference]}
      title={LABELS[preference]}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-edge bg-panel text-ink-muted transition-colors hover:text-ink"
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
