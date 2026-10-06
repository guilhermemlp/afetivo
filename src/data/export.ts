import { localDate } from '@/core/dates';
import type { AfetivoStore } from '@/data/store';

export const EXPORT_FORMAT = 'afetivo-export';
export const EXPORT_VERSION = 1;

export interface ExportPayload {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  /** ISO 8601 do instante da exportação. */
  exportedAt: string;
  counts: {
    entries: number;
    medications: number;
    medicationEvents: number;
    warningSigns: number;
    assessments: number;
  };
  entries: Awaited<ReturnType<AfetivoStore['entries']['list']>>;
  medications: Awaited<ReturnType<AfetivoStore['medications']['list']>>;
  medicationEvents: Awaited<ReturnType<AfetivoStore['medicationEvents']['list']>>;
  warningSigns: Awaited<ReturnType<AfetivoStore['warningSigns']['list']>>;
  assessments: Awaited<ReturnType<AfetivoStore['assessments']['list']>>;
  profile: Awaited<ReturnType<AfetivoStore['profile']['get']>>;
}

/** Backup completo em JSON: todos os registros, como estão, sem servidor. */
export async function collectExport(
  store: AfetivoStore,
  now: number = Date.now(),
): Promise<ExportPayload> {
  const [entries, medications, medicationEvents, warningSigns, assessments, profile] =
    await Promise.all([
      store.entries.list(),
      store.medications.list(),
      store.medicationEvents.list(),
      store.warningSigns.list(),
      store.assessments.list(),
      store.profile.get(),
    ]);

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date(now).toISOString(),
    counts: {
      entries: entries.length,
      medications: medications.length,
      medicationEvents: medicationEvents.length,
      warningSigns: warningSigns.length,
      assessments: assessments.length,
    },
    entries,
    medications,
    medicationEvents,
    warningSigns,
    assessments,
    profile,
  };
}

/** `afetivo-backup-YYYY-MM-DD.json` no calendário local. */
export function exportFilename(now: Date = new Date()): string {
  return `afetivo-backup-${localDate(now)}.json`;
}

/** Baixa o payload como arquivo JSON no navegador (sem rede). */
export function downloadExport(payload: ExportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = exportFilename();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
