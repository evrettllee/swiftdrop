import { ArrowsClockwiseIcon, CheckCircleIcon, ClockIcon, type Icon } from '@phosphor-icons/react';
import type { OrderDetails } from '@/shared/api';
import { formatShortDateTime } from '@/shared/lib/format';
import { PAYMENT_ICON_PROPS, PAYMENT_VIEW } from '../config/payment';
import { PAYMENT_TEXTS } from '../config/texts';
import { getPaymentTime, getPaymentView } from '../lib/payment';
import type { PaymentView } from '../model/payment-view';

type StatusRowLook = {
  icon: Icon;
  iconClass: string;
  label: string;
};

const STATUS_ROWS: Record<PaymentView, StatusRowLook> = {
  [PAYMENT_VIEW.UNPAID]: {
    icon: ClockIcon,
    iconClass: 'text-fg-secondary',
    label: PAYMENT_TEXTS.UNPAID,
  },
  [PAYMENT_VIEW.PAID]: { icon: CheckCircleIcon, iconClass: 'text-success', label: PAYMENT_TEXTS.PAID },
  // The money goes back when the order is cancelled.
  [PAYMENT_VIEW.REFUNDED]: {
    icon: ArrowsClockwiseIcon,
    iconClass: 'text-fg-secondary',
    label: PAYMENT_TEXTS.REFUNDED,
  },
};

type PaymentStatusRowProps = {
  order: OrderDetails;
};

// Whether the order is paid, with the time of the payment or of the refund.
export function PaymentStatusRow({ order }: PaymentStatusRowProps) {
  const view = getPaymentView(order);
  const { icon: StatusIcon, iconClass, label } = STATUS_ROWS[view];
  const time = getPaymentTime(order, view);

  return (
    <div className="flex items-center gap-2">
      <StatusIcon {...PAYMENT_ICON_PROPS} className={`shrink-0 ${iconClass}`} />
      <span className="font-semibold">{label}</span>
      {time === null ? null : (
        <span className="ms-auto text-small text-fg-secondary tabular-nums">
          {formatShortDateTime(time)}
        </span>
      )}
    </div>
  );
}
