import { useState } from 'react';
import { getApiErrorMessage } from '@/shared/api';
import { cancelOrder } from '../api/cancel-order';
import { CANCEL_TEXTS } from '../config/texts';

// Cancels the order; `onCancelled` closes the dialog and loads the order again.
export function useCancelOrder(orderId: number, onCancelled: () => void) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function cancel(): Promise<void> {
    setIsCancelling(true);
    setMessage(null);

    try {
      await cancelOrder(orderId);
      onCancelled();
    } catch (error) {
      setMessage(getApiErrorMessage(error, CANCEL_TEXTS.FAILED));
    } finally {
      setIsCancelling(false);
    }
  }

  return { cancel, isCancelling, message, resetMessage: () => setMessage(null) };
}
