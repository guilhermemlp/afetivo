import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

export interface FieldControl {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (control: FieldControl) => ReactNode;
}

/** Campo com rótulo, pista e erro sempre ligados ao controle (a11y). */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  const control: FieldControl = {
    id,
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(error ? { 'aria-invalid': true } : {}),
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children(control)}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  'w-full min-h-11 rounded-xl border border-edge bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted';

export const textareaClass =
  'w-full min-h-24 rounded-xl border border-edge bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted';

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={[inputClass, className ?? ''].filter(Boolean).join(' ')} {...rest} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={[textareaClass, className ?? ''].filter(Boolean).join(' ')} {...rest} />
  );
}
