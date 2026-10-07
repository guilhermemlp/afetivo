import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { applyTheme, getStoredTheme } from './app/theme';
import { getAuthApi, getSupabase } from '@/data/auth';
import { getAppStore } from '@/data/appStore';
import { runV1MigrationIfNeeded } from '@/data/migration/run';
import { createSupabaseRemote } from '@/data/remote/supabaseRemote';
import { invalidateAfterSync } from '@/data/sync/bridge';
import { notifyLocalChange, startSyncRuntime } from '@/data/sync/runtime';
import { setSyncStatus } from '@/data/sync/status';
import './styles/index.css';

applyTheme(getStoredTheme());

await runV1MigrationIfNeeded(getAppStore());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const supabase = getSupabase();
if (supabase) {
  const authApi = getAuthApi();
  startSyncRuntime({
    store: getAppStore(),
    remote: createSupabaseRemote(supabase),
    getSession: async () => (await authApi?.currentSession()) ?? null,
    onSync: (result) => {
      setSyncStatus({
        kind: 'ok',
        at: Date.now(),
        pushed: result.pushed,
        merged: result.merged,
      });
      invalidateAfterSync(queryClient, result);
    },
    onError: (error) => setSyncStatus({ kind: 'error', at: Date.now(), message: error.message }),
  });
  authApi?.onAuthChange(() => notifyLocalChange());
}

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root não encontrado no index.html');

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
