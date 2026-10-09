import type { OrderStatus } from '@/shared/api';
import { ORDER_STATUS_META, TONE_DOT_CLASS, TONE_RING_CLASS } from '../model/order-status';

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { label, tone, isRing } = ORDER_STATUS_META[status];
  const dotClass = isRing ? TONE_RING_CLASS[tone] : TONE_DOT_CLASS[tone];

  return (
    <span className="inline-flex items-center gap-2 text-small whitespace-nowrap">
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
