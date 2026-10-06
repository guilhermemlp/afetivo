import type { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Classes de tamanho (ex.: `h-4 w-40`). */
  size?: string;
}

export function Skeleton({ size = 'h-16 w-full', className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={['animate-pulse rounded-xl bg-panel-2', size, className ?? '']
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  );
}
