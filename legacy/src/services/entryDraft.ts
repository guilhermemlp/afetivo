import { AfetivoEntry } from '../types/mood';
import { validateEntries } from './validation';

export const ENTRY_DRAFT_STORAGE_KEY = 'afetivo_entry_draft_v1';

export interface EntryDraft {
  version: 1;
  entry: AfetivoEntry;
  showDetails: boolean;
  updatedAt: number;
}

export function loadEntryDraft(): EntryDraft | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const stored = localStorage.getItem(ENTRY_DRAFT_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<EntryDraft>;
    if (
      parsed.version !== 1 ||
      typeof parsed.showDetails !== 'boolean' ||
      typeof parsed.updatedAt !== 'number' ||
      !Number.isFinite(parsed.updatedAt)
    ) {
      throw new Error('Rascunho inválido.');
    }
    const entry = validateEntries([parsed.entry])[0];
    if (!entry || entry.isDemo) throw new Error('Rascunho inválido.');
    return {
      version: 1,
      entry,
      showDetails: parsed.showDetails,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    clearEntryDraft();
    return null;
  }
}

export function saveEntryDraft(
  entry: AfetivoEntry,
  showDetails: boolean,
): boolean {
  if (typeof localStorage === 'undefined' || entry.isDemo) return false;
  try {
    const draft: EntryDraft = {
      version: 1,
      entry,
      showDetails,
      updatedAt: Date.now(),
    };
    localStorage.setItem(ENTRY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearEntryDraft(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(ENTRY_DRAFT_STORAGE_KEY);
  } catch {
    // A falha ao limpar um rascunho não pode interromper o registro principal.
  }
}
