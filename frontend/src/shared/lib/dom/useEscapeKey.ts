import { useEffect, useEffectEvent } from 'react';
import { DOM_EVENT, ESCAPE_KEY } from '@/shared/config';

// Listens on the document, so Escape works wherever the focus is; only while `isActive`.
export function useEscapeKey(onEscape: () => void, isActive: boolean): void {
  const handleEscape = useEffectEvent(onEscape);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === ESCAPE_KEY) {
        handleEscape();
      }
    }

    document.addEventListener(DOM_EVENT.KEY_DOWN, handleKeyDown);

    return () => document.removeEventListener(DOM_EVENT.KEY_DOWN, handleKeyDown);
  }, [isActive]);
}
