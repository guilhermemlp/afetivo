/** Ordenação canônica dos registros: mais recente primeiro. */
export interface MomentLike {
  date: string;
  time: string;
  createdAt: number;
}

/**
 * Ordena por data decrescente, depois horário decrescente e, em empate,
 * por `createdAt` decrescente (registro mais novo primeiro).
 */
export function sortEntriesDesc<T extends MomentLike>(entries: readonly T[]): T[] {
  return [...entries].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.time.localeCompare(a.time) || b.createdAt - a.createdAt,
  );
}
