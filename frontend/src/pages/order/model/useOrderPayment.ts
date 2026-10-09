import { useState } from 'react';
import { getApiErrorMessage, startPayment } from '@/shared/api';
import { PAYMENT_TEXTS } from '../config/texts';

// Starts a payment attempt and leaves for the payment page; the button keeps loading meanwhile.
export function useOrderPayment(orderId: number) {
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function pay(): Promise<void> {
    setIsPaying(true);
    setMessage(null);

    try {
      const { checkoutUrl } = await startPayment(orderId);
      window.location.assign(checkoutUrl);
    } catch (error) {
      setMessage(getApiErrorMessage(error, PAYMENT_TEXTS.START_FAILED));
      setIsPaying(false);
    }
  }

  return { pay, isPaying, message };
}
