import type { OrderStatus } from '@/shared/api';
import { TONE_DOT_CLASS, TONE_RING_CLASS } from '../config/status-tone';
import { getOrderStatusMeta, STATUS_AUDIENCE, type StatusAudience } from '../model/order-status';

type OrderStatusBadgeProps = {
  status: OrderStatus;
  audience?: StatusAudience;
};

export function OrderStatusBadge({
  status,
  audience = STATUS_AUDIENCE.CLIENT,
}: OrderStatusBadgeProps) {
  const { label, tone, isRing } = getOrderStatusMeta(status, audience);
  const dotClass = isRing ? TONE_RING_CLASS[tone] : TONE_DOT_CLASS[tone];

  return (
    <span className="inline-flex items-center gap-2 text-small whitespace-nowrap">
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
