import { formatOrderNumber } from '@/entities/order';
import type { OrderDetails } from '@/shared/api';
import { formatMoney } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { PAYMENT_VIEW } from '../config/payment';
import { CANCEL_TEXTS } from '../config/texts';
import { getPaymentView } from '../lib/payment';
import { useCancelOrder } from '../model/useCancelOrder';

type CancelOrderDialogProps = {
  order: OrderDetails;
  isOpen: boolean;
  onClose: () => void;
  onCancelled: () => void;
};

export function CancelOrderDialog({ order, isOpen, onClose, onCancelled }: CancelOrderDialogProps) {
  const cancellation = useCancelOrder(order.orderId, onCancelled);
  const isPaid = getPaymentView(order) === PAYMENT_VIEW.PAID;

  function close(): void {
    cancellation.resetMessage();
    onClose();
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={close}
      title={CANCEL_TEXTS.title(formatOrderNumber(order.orderId))}
      actions={
        <>
          <Button
            variant="danger"
            loading={cancellation.isCancelling}
            onClick={() => void cancellation.cancel()}
          >
            {CANCEL_TEXTS.CONFIRM}
          </Button>
          <Button variant="secondary" disabled={cancellation.isCancelling} onClick={close}>
            {CANCEL_TEXTS.KEEP}
          </Button>
        </>
      }
    >
      {cancellation.message === null ? null : (
        <InlineAlert variant="error">{cancellation.message}</InlineAlert>
      )}
      {isPaid ? (
        <p>
          {CANCEL_TEXTS.PAID_BEFORE}
          <span className="font-semibold text-fg tabular-nums">
            {formatMoney(order.price, order.currency)}
          </span>
          {CANCEL_TEXTS.PAID_AFTER}
        </p>
      ) : (
        <p>{CANCEL_TEXTS.UNPAID}</p>
      )}
    </Dialog>
  );
}
