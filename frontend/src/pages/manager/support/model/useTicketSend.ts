import { useState } from 'react';
import {
  SUPPORT_SEND_FAILURE,
  type SupportMessage,
  type SupportSendFailure,
  sendSupportMessage,
  supportSendFailureOf,
} from '@/shared/support-api';

type SendOptions = {
  ticketId: number;
  onSent: (message: SupportMessage) => void;
  onClosed: () => void;
};

export function useTicketSend({ ticketId, onSent, onClosed }: SendOptions) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [failure, setFailure] = useState<SupportSendFailure | null>(null);

  async function send(): Promise<void> {
    setIsSending(true);
    setFailure(null);

    try {
      onSent(await sendSupportMessage(ticketId, text.trim()));
      setText('');
    } catch (error) {
      const kind = supportSendFailureOf(error);
      setFailure(kind);

      if (kind === SUPPORT_SEND_FAILURE.CLOSED) {
        onClosed();
      }
    } finally {
      setIsSending(false);
    }
  }

  return {
    text,
    setText,
    isSending,
    failure,
    send: () => void send(),
  };
}
