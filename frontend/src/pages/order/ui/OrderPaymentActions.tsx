import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { ORDER_STATUS, type OrderDetails } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { PAYMENT_ICON_PROPS } from '../config/payment';
import { PAYMENT_TEXTS } from '../config/texts';
import { CANCELLABLE_STATUSES } from '../model/order-status-groups';
import { useOrderPayment } from '../model/useOrderPayment';

type OrderPaymentActionsProps = {
  order: OrderDetails;
  // The formatted price of the order, for the pay button.
  total: string;
  // The last payment attempt did not go through: the pay button offers to try again.
  isPayFailed: boolean;
  // Opens the cancel dialog; the button is hidden until it is given.
  onCancel?: () => void;
};

// The pay button of an unpaid order and the cancel button while the order can be cancelled.
export function OrderPaymentActions({
  order,
  total,
  isPayFailed,
  onCancel,
}: OrderPaymentActionsProps) {
  const payment = useOrderPayment(order.orderId);
  const isPending = order.status === ORDER_STATUS.PENDING;
  const isCancellable = CANCELLABLE_STATUSES.includes(order.status) && onCancel !== undefined;

  return isPending || isCancellable ? (
    <>
      <Divider />
      {payment.message === null ? null : (
        <InlineAlert variant="error">{payment.message}</InlineAlert>
      )}
      {isPending ? (
        <Button
          fullWidth
          loading={payment.isPaying}
          icon={
            isPayFailed ? (
              <ArrowClockwiseIcon {...PAYMENT_ICON_PROPS} className="shrink-0" />
            ) : undefined
          }
          onClick={() => void payment.pay()}
        >
          {isPayFailed ? PAYMENT_TEXTS.RETRY_PAY : PAYMENT_TEXTS.pay(total)}
        </Button>
      ) : null}
      {isCancellable ? (
        <Button variant="secondary" fullWidth onClick={onCancel}>
          {PAYMENT_TEXTS.CANCEL}
        </Button>
      ) : null}
      {isCancellable && !isPending ? (
        <p className="text-caption text-pretty text-fg-secondary">{PAYMENT_TEXTS.CANCEL_HINT}</p>
      ) : null}
    </>
  ) : null;
}
