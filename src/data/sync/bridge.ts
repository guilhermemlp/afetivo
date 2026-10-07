import type { QueryClient } from '@tanstack/react-query';
import type { SyncResult } from './engine';

/**
 * Liga o resultado da sync ao React Query: o pull grava no store, mas as
 * telas só observam as queries — sem invalidação, dados remotos (perfil e
 * registros vindos de outro dispositivo) só apareceriam num refetch manual.
 * Push puro não invalida: as mutações locais já invalidaram as queries
 * correspondentes quando escreveram.
 */
export function invalidateAfterSync(queryClient: QueryClient, result: SyncResult): void {
  if (result.merged > 0 || result.deleted > 0) {
    void queryClient.invalidateQueries();
  }
}
