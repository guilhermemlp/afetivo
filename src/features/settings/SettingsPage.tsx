import { useState } from 'react';
import { appEnv } from '@/core/env';
import { DISCLAIMER } from '@/core/constants';
import { Button, Card, Field, Skeleton, TextInput } from '@/components/ui';
import { useProfile, useUpdateProfile } from '@/data/hooks';

/**
 * Ajustes: perfil (nome), estado da sincronização e aviso legal.
 * Exportação, IA e preferências finais entram no polish (Fase 7).
 */
export function SettingsPage() {
  const { profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  // `null` = ainda não editado nesta sessão; o valor do perfil aparece direto.
  const [name, setName] = useState<string | null>(null);
  const currentName = name ?? profile?.displayName ?? '';
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const env = appEnv();

  async function handleSave(): Promise<void> {
    if (!profile) return;
    setSaved(false);
    setError(null);
    const displayName = currentName.trim();
    try {
      await update.mutateAsync({
        ...profile,
        displayName: displayName === '' ? null : displayName,
      });
      setSaved(true);
    } catch {
      setError('Não foi possível salvar o nome. Tente novamente.');
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Ajustes</h1>

      <Card>
        <h2 className="text-lg font-semibold">Perfil</h2>
        {isLoading ? (
          <Skeleton size="mt-4 h-24 w-full" />
        ) : (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <Field
              label="Nome de exibição"
              hint="Em branco continua sem nome — nada aqui é obrigatório."
              error={error ?? undefined}
            >
              {(control) => (
                <TextInput
                  {...control}
                  value={currentName}
                  maxLength={80}
                  placeholder="Como quer ser chamado(a)?"
                  onChange={(event) => {
                    setName(event.target.value);
                    setSaved(false);
                  }}
                />
              )}
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" loading={update.isPending}>
                Salvar nome
              </Button>
              {saved && (
                <p role="status" className="text-sm text-ink-muted">
                  Nome salvo.
                </p>
              )}
            </div>
          </form>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Sincronização</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {env.remoteEnabled
            ? 'Sincronização entre dispositivos disponível. O login por e-mail entra na Fase 7.'
            : 'Modo local: os dados ficam apenas neste navegador, sem conta e sem servidor.'}
        </p>
        {env.issues.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-danger">
            {env.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}
      </Card>

      <div className="rounded-2xl border border-edge bg-panel-2 p-4 text-xs leading-relaxed text-ink-muted">
        {DISCLAIMER}
      </div>
    </section>
  );
}
