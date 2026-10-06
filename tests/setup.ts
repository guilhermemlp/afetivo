import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// O Vitest roda sem `globals`, então o cleanup automático do Testing Library
// precisa ser registrado manualmente entre os testes.
afterEach(cleanup);

// Recharts (ResponsiveContainer) usa ResizeObserver, ausente no jsdom.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: ResizeObserverStub,
  });
}
