import { type MouseEvent, useEffect, useRef } from 'react';
import { useBodyScrollLock } from '@/shared/lib/dom';

export function useModalDialog(isOpen: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;

    if (dialog === null) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useBodyScrollLock(isOpen);

  function onClick(event: MouseEvent<HTMLDialogElement>): void {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return { ref, onClick };
}
