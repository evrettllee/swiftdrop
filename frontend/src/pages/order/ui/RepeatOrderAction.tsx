import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { saveOrderDraft } from '@/features/order-draft';
import type { OrderDetails } from '@/shared/api';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { PAYMENT_ICON_PROPS } from '../config/payment';
import { PAYMENT_TEXTS } from '../config/texts';
import { buildRepeatDraft } from '../lib/repeat-order';
import { FINISHED_STATUSES } from '../model/order-status-groups';

type RepeatOrderActionProps = {
  order: OrderDetails;
};

// A finished order can be placed again: the order form opens with its route, recipient and package.
export function RepeatOrderAction({ order }: RepeatOrderActionProps) {
  // The client is signed in already, so the order form is not awaited after a sign-in.
  function handleRepeat(): void {
    saveOrderDraft(buildRepeatDraft(order), { pendingCheckout: false });
  }

  return FINISHED_STATUSES.includes(order.status) ? (
    <>
      <Divider />
      <LinkButton
        to={APP_ROUTES.ORDER_NEW}
        onClick={handleRepeat}
        fullWidth
        icon={<ArrowsClockwiseIcon {...PAYMENT_ICON_PROPS} className="shrink-0" />}
      >
        {PAYMENT_TEXTS.REPEAT}
      </LinkButton>
      <p className="text-caption text-pretty text-fg-secondary">{PAYMENT_TEXTS.REPEAT_HINT}</p>
    </>
  ) : null;
}
