import { useEffect, useRef } from 'react';
import { useDocumentVisible } from '@/shared/lib/dom';
import { markSupportRead, type SupportSide } from '@/shared/support-api';

export const READ_DEBOUNCE_MS = 500;

type ReadOptions = {
  side: SupportSide;
  ticketId: number;
  lastIncomingId: number | null;
  isEnabled: boolean;
};

export function useSupportRead({ side, ticketId, lastIncomingId, isEnabled }: ReadOptions): void {
  const isVisible = useDocumentVisible();
  const marked = useRef<string | null>(null);

  useEffect(() => {
    const key = `${side}:${ticketId}:${lastIncomingId}`;

    if (!isEnabled || !isVisible || lastIncomingId === null || marked.current === key) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      marked.current = key;
      markSupportRead(side, ticketId).catch(() => {
        marked.current = null;
      });
    }, READ_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [side, ticketId, lastIncomingId, isEnabled, isVisible]);
}
