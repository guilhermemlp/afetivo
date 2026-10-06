import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '@/app/ErrorBoundary';

function Bomb(): never {
  throw new Error('falha de teste');
}

describe('ErrorBoundary', () => {
  it('renderiza os filhos quando não há erro', () => {
    render(
      <ErrorBoundary>
        <p>tudo certo</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('tudo certo')).toBeInTheDocument();
  });

  it('mostra o fallback quando um filho lança erro', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('falha de teste')).toBeInTheDocument();
  });

  it('permite tentar novamente após o erro', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    let shouldThrow = true;
    function Flaky(): React.JSX.Element | null {
      if (shouldThrow) throw new Error('erro intermitente');
      return <p>recuperado</p>;
    }

    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    );

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(screen.getByText('recuperado')).toBeInTheDocument();
  });
});
