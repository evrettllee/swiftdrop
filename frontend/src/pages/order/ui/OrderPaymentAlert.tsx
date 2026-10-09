import { ClockIcon, XCircleIcon } from '@phosphor-icons/react';
import { ORDER_STATUS, type OrderDetails } from '@/shared/api';
import { MS_PER_MINUTE } from '@/shared/config';
import { formatTime } from '@/shared/lib/format';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { UNPAID_ORDER_TTL_MINUTES } from '../config/payment-return';
import { PAYMENT_ALERT_TEXTS } from '../config/texts';

type OrderPaymentAlertProps = {
  order: OrderDetails;
  isChecking: boolean;
  isFailed: boolean;
};

// The line above the order while it waits for the payment: when it must be paid, that the last
// attempt failed, or that a just made payment is being confirmed.
export function OrderPaymentAlert({ order, isChecking, isFailed }: OrderPaymentAlertProps) {
  const deadline = formatTime(
    new Date(order.createdAt.getTime() + UNPAID_ORDER_TTL_MINUTES * MS_PER_MINUTE),
  );
  let alert = null;

  if (order.status !== ORDER_STATUS.PENDING) {
    alert = null;
  } else if (isChecking) {
    alert = (
      <InlineAlert variant="info" title={PAYMENT_ALERT_TEXTS.CHECKING_TITLE}>
        {PAYMENT_ALERT_TEXTS.CHECKING}
      </InlineAlert>
    );
  } else if (isFailed) {
    alert = (
      <InlineAlert variant="error" icon={XCircleIcon} title={PAYMENT_ALERT_TEXTS.FAILED_TITLE}>
        {PAYMENT_ALERT_TEXTS.failed(deadline)}
      </InlineAlert>
    );
  } else {
    alert = (
      <InlineAlert variant="warning" icon={ClockIcon} title={PAYMENT_ALERT_TEXTS.WAITING_TITLE}>
        {PAYMENT_ALERT_TEXTS.waiting(deadline)}
      </InlineAlert>
    );
  }

  return alert;
}
