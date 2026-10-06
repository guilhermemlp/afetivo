import { useState } from 'react';
import { AuthError, type AuthErrorKind } from '@/data/auth';
import { Button, Field, TextInput } from '@/components/ui';
import { useSendMagicLink, useSession, useSignOut, useSyncStatus } from '@/data/hooks';

const AUTH_MESSAGES: Record<AuthErrorKind, string> = {
  remote_not_configured: 'Sincronização não configurada neste ambiente.',
  invalid_email: 'Confira o endereço de e-mail e tente de novo.',
  rate_limited: 'Muitas tentativas — aguarde alguns minutos antes de reenviar.',
  network: 'Sem conexão com o servidor. Tente novamente.',
  unknown: 'Não foi possível enviar o link agora. Tente novamente.',
};

function authErrorMessage(error: unknown): string {
  if (error instanceof AuthError) return AUTH_MESSAGES[error.kind];
  return 'Não foi possível enviar o link agora. Tente novamente.';
}

function hhmm(at: number): string {
  const date = new Date(at);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function SyncStatusLine() {
  const status = useSyncStatus();

  if (status.kind === 'never') {
    return (
      <p className="text-sm text-ink-muted">
        Sincronização automática em rodízio — ainda não executou nesta sessão.
      </p>
    );
  }
  if (status.kind === 'error') {
    return (
      <p role="alert" className="text-sm text-danger">
        Falha na sincronização às {hhmm(status.at)}: {status.message}. Ela tenta de novo sozinha.
      </p>
    );
  }
  return (
    <p role="status" className="text-sm text-ink-muted">
      Última sincronização às {hhmm(status.at)}: {status.pushed} enviado(s), {status.merged}{' '}
      recebido(s).
    </p>
  );
}

export interface SyncAccessCardProps {
  /** `false` = modo local (a UI de login some, sem conta e sem servidor). */
  remoteEnabled: boolean;
}

/**
 * Acesso por magic link e estado da sincronização. Sem env o app é 100%
 * local; com env, o login é opcional — sem sessão nada é sincronizado.
 */
export function SyncAccessCard({ remoteEnabled }: SyncAccessCardProps) {
  const session = useSession();
  const send = useSendMagicLink();
  const signOut = useSignOut();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (!remoteEnabled) {
    return (
      <p className="text-sm text-ink-muted">
        Modo local: os dados ficam apenas neste navegador, sem conta e sem servidor.
      </p>
    );
  }

  if (session) {
    return (
      <div className="space-y-3">
        <p className="text-sm">
          Conectado como <span className="font-medium">{session.user.email ?? 'conta'}</span>
        </p>
        <SyncStatusLine />
        <Button variant="secondary" loading={signOut.isPending} onClick={() => signOut.mutate()}>
          Sair da conta
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSentTo(null);
        send.mutate(email.trim(), {
          onSuccess: () => setSentTo(email.trim()),
        });
      }}
    >
      <p className="text-sm text-ink-muted">
        Entre recebendo um link por e-mail — sem senha. Depois do login, os dados passam a
        sincronizar entre dispositivos.
      </p>
      <Field
        label="E-mail"
        hint="Enviamos um link de acesso; nada de senha."
        error={send.error ? authErrorMessage(send.error) : undefined}
      >
        {(control) => (
          <TextInput
            {...control}
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            placeholder="voce@email.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              send.reset();
            }}
          />
        )}
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={send.isPending}>
          Enviar link de acesso
        </Button>
        {sentTo && (
          <p role="status" className="text-sm text-ink-muted">
            Link enviado para {sentTo} — confira a caixa de entrada (e o spam).
          </p>
        )}
      </div>
    </form>
  );
}
