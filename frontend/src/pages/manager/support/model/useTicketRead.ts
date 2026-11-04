import { useEffect, useRef } from 'react';
import { useDocumentVisible } from '@/shared/lib/dom';
import { markSupportRead } from '@/shared/support-api';

export const READ_DEBOUNCE_MS = 500;

export function useTicketRead(
  ticketId: number,
  lastAuthorId: number | null,
  isEnabled: boolean,
): void {
  const isVisible = useDocumentVisible();
  const marked = useRef<string | null>(null);

  useEffect(() => {
    const key = `${ticketId}:${lastAuthorId}`;

    if (!isEnabled || !isVisible || lastAuthorId === null || marked.current === key) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      marked.current = key;
      markSupportRead(ticketId).catch(() => {
        marked.current = null;
      });
    }, READ_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [ticketId, lastAuthorId, isEnabled, isVisible]);
}
