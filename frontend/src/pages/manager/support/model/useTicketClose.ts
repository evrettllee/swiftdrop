import { useState } from 'react';
import { closeSupportTicket, type SupportTicket } from '@/shared/support-api';

export function useTicketClose(ticketId: number, onClosed: (ticket: SupportTicket) => void) {
  const [isAsking, setIsAsking] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  async function confirm(): Promise<void> {
    setIsClosing(true);
    setIsFailed(false);

    try {
      onClosed(await closeSupportTicket(ticketId));
      setIsAsking(false);
    } catch {
      setIsFailed(true);
    } finally {
      setIsClosing(false);
    }
  }

  return {
    isAsking,
    isClosing,
    isFailed,
    ask: () => {
      setIsFailed(false);
      setIsAsking(true);
    },
    cancel: () => setIsAsking(false),
    confirm: () => void confirm(),
  };
}
