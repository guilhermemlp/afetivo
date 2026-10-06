import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Limita um erro de renderização a esta tela, sem derrubar o aplicativo
 * inteiro nem afetar os dados já gravados.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Erro não capturado:', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center bg-canvas p-6 text-ink"
      >
        <div className="w-full max-w-lg rounded-2xl border border-edge bg-panel p-6">
          <h1 className="text-xl font-semibold">Algo deu errado</h1>
          <p className="mt-2 text-sm text-ink-muted">
            A tela encontrou um erro inesperado. Seus registros já salvos não foram afetados.
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-panel-2 p-3 text-xs text-ink-muted">
            {error.message}
          </pre>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="min-h-11 rounded-xl bg-brand px-4 text-sm font-medium text-brand-ink"
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-xl border border-edge px-4 text-sm font-medium text-ink"
            >
              Recarregar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
