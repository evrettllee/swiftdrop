import { ORDER_STATUS } from '@/common/enums/order-status.enum';

// Both orders and payments find an order by its id, so they answer with the same texts.
export const ORDER_ID_INVALID_MESSAGE = 'Некорректный номер заказа';
export const ORDER_NOT_FOUND_MESSAGE = 'Заказ не найден';
// Assignment and deliveries: the order row is held by another operation (a cancellation, an accept).
export const ORDER_BUSY_MESSAGE = 'Заказ сейчас обновляется. Попробуйте ещё раз';

// The statuses in which an order is with its courier: a courier has at most one such order.
export const COURIER_ACTIVE_ORDER_STATUSES = [
  ORDER_STATUS.COURIER_ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
] as const;

export const ORDER_FINISHED_STATUSES = [
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REJECTED,
] as const;

export const COURIER_HISTORY_STATUSES = [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED] as const;

// The chat of an order takes new messages only while the order is with its courier; before and
// after that its history is still readable.
export const CHAT_WRITABLE_STATUSES = COURIER_ACTIVE_ORDER_STATUSES;
