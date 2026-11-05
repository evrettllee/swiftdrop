import { useEffect, useEffectEvent } from 'react';
import { useNavigate } from 'react-router';
import { onTypedSocketEvent, SOCKET_EVENTS, SUPPORT_TICKET_EVENT_KIND } from '@/shared/realtime';
import { getSupportTicketPath } from '@/shared/routes';
import { hideToast, showToast } from '@/shared/ui/toast';

export const SUPPORT_REPLY_TEXTS = {
  TITLE: 'Поддержка ответила',
  TEXT: 'Ответ ждёт в обращении',
  OPEN: 'Открыть',
} as const;

export function useSupportReplyToast(supportPath: string): void {
  const navigate = useNavigate();

  const present = useEffectEvent((ticketId: number) => {
    const ticketPath = getSupportTicketPath(supportPath, ticketId);

    if (window.location.pathname === ticketPath) {
      return;
    }

    const key = `support:${ticketId}`;
    showToast({
      key,
      variant: 'chat',
      title: SUPPORT_REPLY_TEXTS.TITLE,
      text: SUPPORT_REPLY_TEXTS.TEXT,
      action: {
        label: SUPPORT_REPLY_TEXTS.OPEN,
        onAction: () => {
          hideToast(key);
          void navigate(ticketPath);
        },
      },
    });
  });

  useEffect(
    () =>
      onTypedSocketEvent(SOCKET_EVENTS.SUPPORT_TICKET, (payload) => {
        if (payload.kind === SUPPORT_TICKET_EVENT_KIND.MESSAGE) {
          present(payload.ticketId);
        }
      }),
    [],
  );
}
