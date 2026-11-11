import { ArrowsClockwiseIcon, CheckCircleIcon, ClockIcon, type Icon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatShortDateTime } from '@/shared/lib/format';
import { PAYMENT_VIEW, PAYMENT_VIEW_LABELS, type PaymentView } from '../config/payment-view';

type StatusRowLook = {
  icon: Icon;
  iconClass: string;
};

const STATUS_ROWS: Record<PaymentView, StatusRowLook> = {
  [PAYMENT_VIEW.UNPAID]: { icon: ClockIcon, iconClass: 'text-fg-secondary' },
  [PAYMENT_VIEW.PAID]: { icon: CheckCircleIcon, iconClass: 'text-success' },
  [PAYMENT_VIEW.REFUNDED]: { icon: ArrowsClockwiseIcon, iconClass: 'text-fg-secondary' },
};

type PaymentStatusRowProps = {
  view: PaymentView;
  time: Date | null;
};

export function PaymentStatusRow({ view, time }: PaymentStatusRowProps) {
  const { icon: StatusIcon, iconClass } = STATUS_ROWS[view];

  return (
    <div className="flex items-center gap-2">
      <StatusIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className={`shrink-0 ${iconClass}`}
      />
      <span className="font-semibold">{PAYMENT_VIEW_LABELS[view]}</span>
      {time === null ? null : (
        <span className="ms-auto text-small text-fg-secondary tabular-nums">
          {formatShortDateTime(time)}
        </span>
      )}
    </div>
  );
}
