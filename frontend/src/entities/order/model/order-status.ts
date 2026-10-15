import { ORDER_STATUS, type OrderStatus } from '@/shared/api';
import { STATUS_TONE, type StatusTone } from '../config/status-tone';
import { ORDER_STATUS_LABELS } from '../config/texts';

type StatusMeta = {
  label: string;
  tone: StatusTone;
  // A ring instead of a filled dot: the parcel is on its way.
  isRing: boolean;
};

function meta(status: OrderStatus, tone: StatusTone, isRing = false): StatusMeta {
  return { label: ORDER_STATUS_LABELS[status], tone, isRing };
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  [ORDER_STATUS.PENDING]: meta(ORDER_STATUS.PENDING, STATUS_TONE.NEW),
  [ORDER_STATUS.CONFIRMED]: meta(ORDER_STATUS.CONFIRMED, STATUS_TONE.ACTIVE),
  [ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT]: meta(
    ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
    STATUS_TONE.ACTIVE,
  ),
  [ORDER_STATUS.COURIER_ASSIGNED]: meta(ORDER_STATUS.COURIER_ASSIGNED, STATUS_TONE.ACTIVE),
  [ORDER_STATUS.PICKED_UP]: meta(ORDER_STATUS.PICKED_UP, STATUS_TONE.ACTIVE),
  [ORDER_STATUS.IN_TRANSIT]: meta(ORDER_STATUS.IN_TRANSIT, STATUS_TONE.ACTIVE, true),
  [ORDER_STATUS.DELIVERED]: meta(ORDER_STATUS.DELIVERED, STATUS_TONE.DELIVERED),
  [ORDER_STATUS.CANCELLED]: meta(ORDER_STATUS.CANCELLED, STATUS_TONE.CANCELLED),
  [ORDER_STATUS.REJECTED]: meta(ORDER_STATUS.REJECTED, STATUS_TONE.CANCELLED),
};
