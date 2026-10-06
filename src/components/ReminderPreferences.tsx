import React, { useState } from 'react';
import { BellRing } from 'lucide-react';

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => boolean;
}

export const ReminderPreferences: React.FC<Props> = ({ enabled, onChange }) => {
  const [message, setMessage] = useState('');

  const updatePreference = (checked: boolean) => {
    const saved = onChange(checked);
    setMessage(
      saved
        ? 'Preferência salva neste dispositivo. Nenhuma notificação será enviada por enquanto.'
        : 'Não foi possível guardar essa preferência neste dispositivo.',
    );

    // FUTURO — Notification API:
    // Este é o ponto para solicitar Notification.requestPermission(), somente
    // após esta ação explícita. Não pedir permissão ao carregar a página.
    // Se a permissão for concedida, a programação deve continuar local e
    // opcional; nunca incluir humor, emoções ou notas no texto da notificação.
  };

  return (
    <section
      aria-labelledby="reminder-preferences-title"
      className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="flex items-start gap-3">
        <BellRing
          className="mt-0.5 h-5 w-5 shrink-0 text-teal-700 dark:text-teal-300"
          aria-hidden="true"
        />
        <div className="space-y-3">
          <div>
            <h2 id="reminder-preferences-title" className="font-semibold">
              Preferência de lembretes
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Se um toque leve puder ajudar, você poderá escolher lembretes sem
              frequência obrigatória.
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-teal-700"
              checked={enabled}
              onChange={(event) => updatePreference(event.target.checked)}
              aria-describedby="reminder-preferences-help"
            />
            <span>Quero usar lembretes leves quando estiverem disponíveis.</span>
          </label>
          <p
            id="reminder-preferences-help"
            className="text-xs text-stone-500"
          >
            Por enquanto, isso apenas guarda sua preferência neste dispositivo.
            O Afetivo ainda não solicita permissão nem envia notificações.
          </p>
          {message && (
            <p role="status" className="text-xs text-teal-800 dark:text-teal-300">
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
