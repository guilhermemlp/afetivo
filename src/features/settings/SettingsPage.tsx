import { useState } from 'react';
import { appEnv } from '@/core/env';
import { DISCLAIMER } from '@/core/constants';
import { Button, Card, Field, Skeleton, TextInput } from '@/components/ui';
import { useProfile, useUpdateProfile } from '@/data/hooks';
import { getAppStore } from '@/data/appStore';
import { collectExport, downloadExport } from '@/data/export';
import { SyncAccessCard } from './SyncAccessCard';

/**
 * Ajustes: perfil, acesso/sincronização, exportação de backup e aviso legal.
 */
export function SettingsPage() {
  const { profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  // `null` = ainda não editado nesta sessão; o valor do perfil aparece direto.
  const [name, setName] = useState<string | null>(null);
  const currentName = name ?? profile?.displayName ?? '';
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [exportError, setExportError] = useState(false);
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

  async function handleExport(): Promise<void> {
    setExporting(true);
    setExported(false);
    setExportError(false);
    try {
      downloadExport(await collectExport(getAppStore()));
      setExported(true);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
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
        <h2 className="text-lg font-semibold">Sincronização e acesso</h2>
        <div className="mt-3">
          <SyncAccessCard remoteEnabled={env.remoteEnabled} />
        </div>
        {env.issues.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-danger">
            {env.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Exportar dados</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Baixa um arquivo JSON com tudo o que você registrou — registros, medicações e perfil. O
          arquivo fica no seu dispositivo; nada passa pelo servidor.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleExport()} loading={exporting}>
            Exportar dados (JSON)
          </Button>
          {exported && (
            <p role="status" className="text-sm text-ink-muted">
              Arquivo gerado — confira a pasta de downloads.
            </p>
          )}
          {exportError && (
            <p role="alert" className="text-sm text-danger">
              Não foi possível gerar o arquivo. Tente novamente.
            </p>
          )}
        </div>
      </Card>

      <div className="rounded-2xl border border-edge bg-panel-2 p-4 text-xs leading-relaxed text-ink-muted">
        {DISCLAIMER}
      </div>
    </section>
  );
}
