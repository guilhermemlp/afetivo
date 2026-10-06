import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'afetivo_theme';

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function getStoredTheme(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark') return value;
  } catch {
    /* localStorage indisponível */
  }
  return 'system';
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return preference;
}

export function applyTheme(preference: ThemePreference): void {
  document.documentElement.classList.toggle('dark', resolveTheme(preference) === 'dark');
}

export function storeTheme(preference: ThemePreference): void {
  try {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    /* armazenamento indisponível — aplica só em memória */
  }
  applyTheme(preference);
}

/**
 * Estado da preferência de tema: `system` → `light` → `dark` → `system`.
 * O listener do sistema só age quando a preferência é `system`.
 */
export function useTheme(): {
  preference: ThemePreference;
  resolved: 'light' | 'dark';
  cycle: () => void;
} {
  const [preference, setPreference] = useState<ThemePreference>(getStoredTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => {
      if (getStoredTheme() === 'system') applyTheme('system');
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const cycle = useCallback(() => {
    setPreference((current) => {
      const next: ThemePreference =
        current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
      storeTheme(next);
      return next;
    });
  }, []);

  return { preference, resolved: resolveTheme(preference), cycle };
}
