import {
  CheckCircleIcon,
  ClockIcon,
  type Icon,
  WifiXIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import { memo, useState } from 'react';
import { type OrderTracking, useTrackingState } from '@/entities/order';
import type { OrderDetails, OrderStatus } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { getStatusLine, STATUS_LINE_ICON, type StatusLineIcon } from '../lib/status-line';
import { getStatusLineAnchorMs } from '../lib/status-line-anchor';
import { useMinuteNow } from '../model/useMinuteNow';

const ICONS: Record<StatusLineIcon, { icon: Icon; className: string }> = {
  [STATUS_LINE_ICON.CLOCK]: { icon: ClockIcon, className: 'text-warning' },
  [STATUS_LINE_ICON.FAILURE]: { icon: XCircleIcon, className: 'text-danger' },
  [STATUS_LINE_ICON.OFFLINE]: { icon: WifiXIcon, className: 'text-warning' },
  [STATUS_LINE_ICON.SUCCESS]: { icon: CheckCircleIcon, className: 'text-success' },
};

type OrderStatusLineProps = {
  order: OrderDetails;
  paymentReturn: { isChecking: boolean; isFailed: boolean };
  tracking: OrderTracking;
};

function useStatusAnnouncement(status: OrderStatus, title: string): string {
  const [announced, setAnnounced] = useState({ status, text: '' });

  if (announced.status !== status) {
    setAnnounced({ status, text: title });
  }

  return announced.text;
}

export const OrderStatusLine = memo(function OrderStatusLine({
  order,
  paymentReturn,
  tracking: store,
}: OrderStatusLineProps) {
  const tracking = useTrackingState(store);
  const nowMs = useMinuteNow(getStatusLineAnchorMs({ order, tracking }));
  const line = getStatusLine({ order, payment: paymentReturn, tracking, nowMs });
  const look = line.icon === null ? null : ICONS[line.icon];
  const announcement = useStatusAnnouncement(order.status, line.title);

  return (
    <section className="order-first flex flex-col gap-1 lg:order-none">
      <div className="flex items-center gap-2">
        {look === null ? null : (
          <look.icon
            size={ICON_SIZE.MEDIUM}
            weight={ICON_WEIGHT}
            aria-hidden="true"
            className={`shrink-0 ${look.className}`}
          />
        )}
        <h2 className="text-heading-sm font-semibold text-pretty tabular-nums">{line.title}</h2>
      </div>
      {line.text === null ? null : (
        <p className="text-small text-pretty text-fg-secondary tabular-nums">{line.text}</p>
      )}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
});
