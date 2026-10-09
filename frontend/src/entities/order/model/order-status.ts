import { ORDER_STATUS, type OrderStatus } from '@/shared/api';
import { STATUS_TONE, type StatusTone } from '../config/status-tone';

type StatusMeta = {
  label: string;
  tone: StatusTone;
  // A ring instead of a filled dot: the parcel is on its way.
  isRing: boolean;
};

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  [ORDER_STATUS.PENDING]: { label: 'Ожидает оплаты', tone: STATUS_TONE.NEW, isRing: false },
  [ORDER_STATUS.CONFIRMED]: { label: 'Подтверждён', tone: STATUS_TONE.ACTIVE, isRing: false },
  [ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT]: {
    label: 'Подбираем курьера',
    tone: STATUS_TONE.ACTIVE,
    isRing: false,
  },
  [ORDER_STATUS.COURIER_ASSIGNED]: {
    label: 'Курьер назначен',
    tone: STATUS_TONE.ACTIVE,
    isRing: false,
  },
  [ORDER_STATUS.PICKED_UP]: { label: 'Курьер забрал', tone: STATUS_TONE.ACTIVE, isRing: false },
  [ORDER_STATUS.IN_TRANSIT]: { label: 'В пути', tone: STATUS_TONE.ACTIVE, isRing: true },
  [ORDER_STATUS.DELIVERED]: { label: 'Доставлен', tone: STATUS_TONE.DELIVERED, isRing: false },
  [ORDER_STATUS.CANCELLED]: { label: 'Отменён', tone: STATUS_TONE.CANCELLED, isRing: false },
  [ORDER_STATUS.REJECTED]: { label: 'Отклонён', tone: STATUS_TONE.CANCELLED, isRing: false },
};

// Full class names, so that Tailwind finds them.
export const TONE_DOT_CLASS: Record<StatusTone, string> = {
  [STATUS_TONE.NEW]: 'bg-status-new',
  [STATUS_TONE.ACTIVE]: 'bg-status-active',
  [STATUS_TONE.DELIVERED]: 'bg-status-delivered',
  [STATUS_TONE.CANCELLED]: 'bg-status-cancelled',
};

export const TONE_RING_CLASS: Record<StatusTone, string> = {
  [STATUS_TONE.NEW]: 'border-2 border-status-new',
  [STATUS_TONE.ACTIVE]: 'border-2 border-status-active',
  [STATUS_TONE.DELIVERED]: 'border-2 border-status-delivered',
  [STATUS_TONE.CANCELLED]: 'border-2 border-status-cancelled',
};
