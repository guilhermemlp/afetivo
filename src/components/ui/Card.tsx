import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Painel padrão do app: borda suave, cantos arredondados, fundo elevado. */
export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div
      className={['rounded-2xl border border-edge bg-panel p-4 sm:p-6', className ?? '']
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
