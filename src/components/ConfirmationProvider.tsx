import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const ConfirmationContext = createContext<(message: string) => Promise<boolean>>(() => Promise.resolve(false));

export function useConfirmation() {
  return useContext(ConfirmationContext);
}

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const resolver = useRef<((answer: boolean) => void) | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const finish = (answer: boolean) => {
    dialog.current?.close();
    resolver.current?.(answer);
    resolver.current = null;
    setMessage(null);
  };

  useEffect(() => {
    if (message !== null) dialog.current?.showModal();
  }, [message]);

  useEffect(() => () => { resolver.current?.(false); }, []);

  const confirm = (text: string) => new Promise<boolean>((resolve) => {
    // Do not overwrite a pending destructive action.
    if (resolver.current) { resolve(false); return; }
    resolver.current = resolve;
    setMessage(text);
  });

  return (
    <ConfirmationContext.Provider value={confirm}>
      {children}
      <dialog ref={dialog} aria-labelledby="confirmation-title" aria-describedby="confirmation-message"
        onCancel={(event) => { event.preventDefault(); finish(false); }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-stone-900 shadow-2xl backdrop:bg-black/50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100">
        <h2 id="confirmation-title" className="text-lg font-semibold">Confirmar ação</h2>
        <p id="confirmation-message" className="mt-3 text-sm">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" autoFocus onClick={() => finish(false)} className="cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-sm">Cancelar</button>
          <button type="button" onClick={() => finish(true)} className="cursor-pointer rounded-lg bg-rose-700 px-4 py-2 text-sm text-white">Confirmar</button>
        </div>
      </dialog>
    </ConfirmationContext.Provider>
  );
}
