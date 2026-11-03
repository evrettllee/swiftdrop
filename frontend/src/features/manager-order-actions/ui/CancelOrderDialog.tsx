import { useState } from 'react';
import { formatOrderNumber } from '@/entities/order';
import { APP_CURRENCY } from '@/shared/config';
import { formatMoney } from '@/shared/lib/format';
import { cancelManagerOrder } from '@/shared/staff-api';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { CANCEL_DONE_TITLES, CANCEL_TEXTS, DONE_TEXTS } from '../config/texts';
import { toReason } from '../lib/reason';
import { isRefundable, type StaffOrderTarget } from '../model/order-target';
import { useReasonAction } from '../model/useReasonAction';
import { FailureAlert } from './FailureAlert';
import { ReasonField } from './ReasonField';

type CancelOrderDialogProps = {
  target: StaffOrderTarget;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
};

export function CancelOrderDialog({ target, isOpen, onClose, onChanged }: CancelOrderDialogProps) {
  const orderNumber = formatOrderNumber(target.orderId);
  const [isReasonMissing, setIsReasonMissing] = useState(false);
  const cancel = useReasonAction({
    run: (reasonText) => cancelManagerOrder(target.orderId, toReason(reasonText) ?? ''),
    toastOf: ({ refund }) => ({
      title: CANCEL_DONE_TITLES[refund],
      text: DONE_TEXTS.order(orderNumber),
    }),
    toastKey: `order-action-${target.orderId}`,
    onClose,
    onChanged,
  });

  function submit(): void {
    if (toReason(cancel.reasonText) === null) {
      setIsReasonMissing(true);

      return;
    }

    void cancel.submit();
  }

  function changeReason(text: string): void {
    setIsReasonMissing(false);
    cancel.setReasonText(text);
  }

  return (
    <Dialog
      width="large"
      hasDividers
      isOpen={isOpen}
      onClose={onClose}
      title={CANCEL_TEXTS.title(orderNumber)}
      actions={
        <>
          <Button variant="danger" loading={cancel.action.isSubmitting} onClick={submit}>
            {CANCEL_TEXTS.SUBMIT}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {CANCEL_TEXTS.KEEP}
          </Button>
        </>
      }
    >
      <ReasonField
        value={cancel.reasonText}
        hint={CANCEL_TEXTS.REASON_HINT}
        error={isReasonMissing ? CANCEL_TEXTS.REASON_REQUIRED : cancel.fieldError}
        isRequired
        onChange={changeReason}
      />
      {isRefundable(target) ? (
        <InlineAlert
          variant="info"
          title={CANCEL_TEXTS.refundTitle(formatMoney(target.price, APP_CURRENCY))}
        >
          {CANCEL_TEXTS.REFUND_TEXT}
        </InlineAlert>
      ) : null}
      <FailureAlert
        failure={cancel.action.failure}
        isFieldShown
        onRetry={submit}
        onRefresh={cancel.refresh}
      />
    </Dialog>
  );
}
