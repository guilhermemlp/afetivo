import { DISCLAIMER } from '@/core/constants';

/**
 * Tela "Ajustes" — perfil, tema, exportação, sincronização e preferências de IA.
 * Implementação completa nas Fases 2 (conta/sync) e 7 (polish).
 */
export function SettingsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Ajustes</h1>
      <div className="rounded-2xl border border-edge bg-panel p-6">
        <p className="font-medium">Conta e sincronização</p>
        <p className="mt-1 text-sm text-ink-muted">
          Login, sincronização entre dispositivos, exportação JSON/CSV e preferências de IA entram
          nas Fases 2 e 7 da reescrita.
        </p>
      </div>
      <div className="rounded-2xl border border-edge bg-panel-2 p-4 text-xs leading-relaxed text-ink-muted">
        {DISCLAIMER}
      </div>
    </section>
  );
}
