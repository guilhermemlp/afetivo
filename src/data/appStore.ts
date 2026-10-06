import { createDexieStore } from './dexieStore';
import type { AfetivoStore } from './store';

let store: AfetivoStore | null = null;

/** Instância única da persistência local (IndexedDB). */
export function getAppStore(): AfetivoStore {
  store ??= createDexieStore();
  return store;
}

/** Testes e previews: injetam outra implementação (`null` recria no próximo uso). */
export function setAppStore(next: AfetivoStore | null): void {
  store = next;
}
