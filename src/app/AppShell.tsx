import { NavLink, Outlet, Link } from 'react-router-dom';
import { DISCLAIMER } from '@/core/constants';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { to: '/', label: 'Hoje', end: true },
  { to: '/diario', label: 'Diário' },
  { to: '/padroes', label: 'Padrões' },
  { to: '/medicacoes', label: 'Medicações' },
  { to: '/ajustes', label: 'Ajustes' },
] as const;

/**
 * Estrutura comum a todas as telas: cabeçalho, navegação única
 * (o v1 mantinha duas cópias separadas para desktop e mobile),
 * conteúdo da rota e rodapé com o aviso legal.
 */
export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-20 focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-ink"
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="shrink-0 text-lg font-semibold tracking-tight text-brand"
            aria-label="Afetivo — ir para Hoje"
          >
            Afetivo
          </Link>

          <nav aria-label="Seções" className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  [
                    'shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand text-brand-ink' : 'text-ink-muted hover:text-ink',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-edge px-4 py-5">
        <p className="mx-auto max-w-5xl text-center text-xs leading-relaxed text-ink-muted">
          {DISCLAIMER}
        </p>
      </footer>
    </div>
  );
}
