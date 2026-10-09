import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ORDER_STATUS, type OrderDetails, PAYMENT_STATUS } from '@/shared/api';
import {
  PAYMENT_CHECK_ATTEMPTS,
  PAYMENT_CHECK_INTERVAL_MS,
  PAYMENT_RETURN,
  PAYMENT_RETURN_PARAM,
} from '../config/payment-return';

// What the return from the payment page means for the order. After a success the webhook may come
// a moment later, so the order is asked again a few times while it still waits for the payment.
export function usePaymentReturn(order: OrderDetails | null, reload: () => void) {
  const [searchParams] = useSearchParams();
  const [checks, setChecks] = useState(0);
  const result = searchParams.get(PAYMENT_RETURN_PARAM);
  const isPending = order?.status === ORDER_STATUS.PENDING;
  const isChecking =
    isPending && result === PAYMENT_RETURN.SUCCESS && checks < PAYMENT_CHECK_ATTEMPTS;

  useEffect(() => {
    if (!isChecking) {
      return;
    }

    const timer = window.setTimeout(() => {
      setChecks((current) => current + 1);
      reload();
    }, PAYMENT_CHECK_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [isChecking, checks, reload]);

  return {
    isChecking,
    // The client left the payment page, or the payment session expired.
    isFailed:
      isPending &&
      (result === PAYMENT_RETURN.CANCELLED || order?.payment?.status === PAYMENT_STATUS.FAILED),
  };
}
