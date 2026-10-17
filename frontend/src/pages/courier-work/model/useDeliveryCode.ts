import { useEffect, useRef, useState } from 'react';
import { deliverOrder } from '../api/courier-order';
import { DELIVERY_CODE_LENGTH } from '../config/delivery-code';
import { DELIVERY_FAILURE, type DeliveryFailure, readDeliveryFailure } from './delivery-failure';

type DeliveryCodeOptions = {
  orderId: number;
  // The moment the backend answered, for the time the order was closed.
  onDelivered: (closedAt: Date) => void;
  onStale: (message: string) => void;
};

// The code the courier types and its check by the backend. The code lives only in this state: it
// is not logged or stored anywhere and goes with the screen. A second press is ignored until the
// answer. The request is not cancelled when the screen is left: the order may already be closed.
export function useDeliveryCode({ orderId, onDelivered, onStale }: DeliveryCodeOptions) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isWrong, setIsWrong] = useState(false);
  const [isPending, setIsPending] = useState(false);
  // Set at once, so a second press is ignored before any render could mark the button busy.
  const isBusy = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  // A new digit after a wrong code takes the red off the cells; the text stays until the next try.
  function change(next: string): void {
    // A dropped letter is no new digit.
    if (next === code) {
      return;
    }

    setCode(next);
    setIsWrong(false);
  }

  function fail({ kind, message }: DeliveryFailure): void {
    if (kind === DELIVERY_FAILURE.STALE) {
      onStale(message);
      return;
    }

    if (kind === DELIVERY_FAILURE.WRONG_CODE || kind === DELIVERY_FAILURE.LOCKED) {
      setCode('');
      inputRef.current?.focus();
    }

    setIsWrong(kind === DELIVERY_FAILURE.WRONG_CODE);
    setError(message);
  }

  async function submit(): Promise<void> {
    if (isBusy.current || code.length !== DELIVERY_CODE_LENGTH) {
      return;
    }

    isBusy.current = true;
    setIsPending(true);
    // The alert leaves and comes back, so even the same text is read out again.
    setError(null);
    setIsWrong(false);

    try {
      await deliverOrder(orderId, code);
      setCode('');
      onDelivered(new Date());
    } catch (failure) {
      fail(readDeliveryFailure(failure));
    } finally {
      isBusy.current = false;
      setIsPending(false);
    }
  }

  const isComplete = code.length === DELIVERY_CODE_LENGTH;

  return { code, error, isWrong, isPending, isComplete, inputRef, change, submit };
}
