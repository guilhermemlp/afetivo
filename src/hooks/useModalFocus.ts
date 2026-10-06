import { useEffect, useRef } from 'react';

const focusableSelector = [
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'summary',
  'a[href]',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function visibleFocusableElements(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    (element) =>
      element.getClientRects().length > 0 &&
      element.getAttribute('aria-hidden') !== 'true',
  );
}

/** Keep keyboard navigation in the open modal and return to its trigger on close. */
export function useModalFocus(onClose: () => void) {
  const ref = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;
    root.focus({ preventScroll: true });
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = visibleFocusableElements(root);
      const first = controls[0],
        last = controls[controls.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === root)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === root)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    const containFocus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || root.contains(target)) return;

      // A confirmação nativa pode abrir sobre este modal. Nesse caso, ela
      // assume temporariamente o foco sem enfraquecer o trap do logger.
      const stackedModal = target.closest<HTMLElement>(
        'dialog[open], [role="dialog"][aria-modal="true"]',
      );
      if (stackedModal && stackedModal !== root) return;

      root.focus({ preventScroll: true });
    };
    root.addEventListener('keydown', keyboard);
    document.addEventListener('focusin', containFocus);
    return () => {
      root.removeEventListener('keydown', keyboard);
      document.removeEventListener('focusin', containFocus);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return ref;
}
