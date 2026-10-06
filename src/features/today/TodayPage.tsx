/**
 * Tela "Hoje" — visão do dia e atalho para o registro rápido.
 * Implementação completa na Fase 3 (UI base).
 */
export function TodayPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Hoje</h1>
      <div className="rounded-2xl border border-edge bg-panel p-6">
        <p className="font-medium">Nenhum registro ainda</p>
        <p className="mt-1 text-sm text-ink-muted">
          O registro rápido (valência + ativação em segundos) chega na Fase 3 da reescrita.
        </p>
      </div>
    </section>
  );
}
