import { ORDER_STATUS } from '../enums/order-status.enum';

// Both orders and payments find an order by its id, so they answer with the same texts.
export const ORDER_ID_INVALID_MESSAGE = 'Некорректный номер заказа';
export const ORDER_NOT_FOUND_MESSAGE = 'Заказ не найден';

// The statuses in which an order is with its courier: a courier has at most one such order.
export const COURIER_ACTIVE_ORDER_STATUSES = [
  ORDER_STATUS.COURIER_ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
] as const;
