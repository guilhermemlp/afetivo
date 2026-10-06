import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { setAppStore } from '@/data/appStore';
import { createMemoryStore, type MemoryStoreSeed } from '@/data/memoryStore';
import type { AfetivoStore } from '@/data/store';

/** Store em memória injetada no singleton (mesmo caminho do app). */
export function setupStore(seed: MemoryStoreSeed = {}): AfetivoStore {
  const store = createMemoryStore(seed);
  setAppStore(store);
  return store;
}

/** Renderiza uma tela com Query Client e Router próprios de cada teste. */
export function renderApp(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
