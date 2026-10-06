import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-ink-muted">O endereço acessado não existe nesta versão.</p>
      <Link
        to="/"
        className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-medium text-brand-ink"
      >
        Voltar para Hoje
      </Link>
    </section>
  );
}
