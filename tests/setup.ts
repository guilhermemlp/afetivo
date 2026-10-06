import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// O Vitest roda sem `globals`, então o cleanup automático do Testing Library
// precisa ser registrado manualmente entre os testes.
afterEach(cleanup);
