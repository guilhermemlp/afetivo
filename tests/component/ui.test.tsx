import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '@/components/ui/Button';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, TextInput } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';

describe('Button', () => {
  it('dispara o clique e, em loading, bloqueia novo acionamento', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Salvar</Button>);

    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button loading onClick={onClick}>
        Salvar
      </Button>,
    );
    const loading = screen.getByRole('button', { name: 'Salvar' });
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute('aria-busy', 'true');

    await user.click(loading);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('ChoiceButton', () => {
  it('espelha a seleção em aria-pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      <ChoiceButton selected={false} onClick={onClick}>
        Neutro
      </ChoiceButton>,
    );

    const button = screen.getByRole('button', { name: 'Neutro' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <ChoiceButton selected onClick={onClick}>
        Neutro
      </ChoiceButton>,
    );
    expect(screen.getByRole('button', { name: 'Neutro' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Field', () => {
  it('liga rótulo e erro ao controle', () => {
    render(
      <Field label="Nota" error="Muito longa">
        {(control) => <TextInput {...control} />}
      </Field>,
    );

    const input = screen.getByLabelText('Nota');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Muito longa');
    expect(input.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('liga a pista quando não há erro', () => {
    render(
      <Field label="Nome" hint="Opcional">
        {(control) => <TextInput {...control} />}
      </Field>,
    );

    const input = screen.getByLabelText('Nome');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Modal', () => {
  it('abre como diálogo focado e fecha no Escape, no X e no fundo', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal open onClose={onClose} title="Editar registro">
        <button type="button">Conteúdo</button>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Editar registro' });
    expect(dialog).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.mouseDown(dialog.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(3);

    rerender(
      <Modal open={false} onClose={onClose} title="Editar registro">
        <p>conteúdo</p>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('renderiza título, descrição e ação', () => {
    render(
      <EmptyState
        title="Nada por aqui"
        description="Ainda não há registros."
        action={<button type="button">Registrar</button>}
      />,
    );

    expect(screen.getByText('Nada por aqui')).toBeInTheDocument();
    expect(screen.getByText('Ainda não há registros.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeInTheDocument();
  });
});
