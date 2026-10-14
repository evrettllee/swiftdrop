import { ORDER_NOT_FOUND_MESSAGE } from '../../../common/constants/orders.constants';
import { MS_PER_MINUTE } from '../../../common/constants/time.constants';
import { ORDER_STATUS, type OrderStatus } from '../../../common/enums/order-status.enum';
import { ORDER_ID_ROUTE_PARAM } from '../../orders/constants/orders.constants';

// Routes
export const COURIER_ORDERS_ROUTES = {
  BASE: 'couriers/me/orders',
  CURRENT: 'current',
  HISTORY: 'history',
  PICKUP: `${ORDER_ID_ROUTE_PARAM}/pickup`,
  DEPART: `${ORDER_ID_ROUTE_PARAM}/depart`,
  DELIVER: `${ORDER_ID_ROUTE_PARAM}/deliver`,
} as const;

export const COURIER_STATS_ROUTES = {
  BASE: 'couriers/me/stats',
  TODAY: 'today',
} as const;

// The client's side of the delivery lives under the orders of the client.
export const CLIENT_ORDER_COURIER_ROUTES = {
  BASE: 'orders',
  COURIER: `${ORDER_ID_ROUTE_PARAM}/courier`,
} as const;

// Delivery code
// The recipient tells the courier these digits at the door, so the code is short.
export const DELIVERY_CODE_LENGTH = 4;
export const DELIVERY_CODE_RANGE = 10 ** DELIVERY_CODE_LENGTH;
export const DELIVERY_CODE_PAD = '0';
export const DELIVERY_CODE_PATTERN = /^[0-9]{4}$/;
// Five wrong codes in a row lock the entering for a while, so 10 000 codes cannot be tried.
export const DELIVERY_CODE_MAX_ATTEMPTS = 5;
export const DELIVERY_CODE_LOCK_MINUTES = 15;
export const DELIVERY_CODE_LOCK_MS = DELIVERY_CODE_LOCK_MINUTES * MS_PER_MINUTE;

// What the check of a code ended with; the errors are thrown after the commit.
export const HANDOVER_OUTCOME = {
  DELIVERED: 'delivered',
  NOT_FOUND: 'not_found',
  WRONG_STEP: 'wrong_step',
  LOCKED: 'locked',
  WRONG_CODE: 'wrong_code',
} as const;

// Client view
// The client sees the courier while the order is with them and after the delivery.
export const COURIER_VISIBLE_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.COURIER_ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.DELIVERED,
];

// The code is shown only once the parcel is picked up, when the order can no longer be cancelled.
export const DELIVERY_CODE_VISIBLE_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
];

// The courier's last name is cut to its first letter and this mark.
export const LAST_NAME_INITIAL_MARK = '.';

// History
// Orders that ended while they were with the courier.
export const HISTORY_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
];
export const HISTORY_FIRST_PAGE = 1;
export const HISTORY_PAGE_SIZE_MIN = 1;
export const HISTORY_PAGE_SIZE_DEFAULT = 10;
export const HISTORY_PAGE_SIZE_MAX = 50;

// Validation
export const DELIVERIES_VALIDATION_MESSAGES = {
  CODE_INVALID: 'Введите 4 цифры кода',
  PAGE_INVALID: 'Некорректный номер страницы',
  LIMIT_INVALID: `Размер страницы: от ${HISTORY_PAGE_SIZE_MIN} до ${HISTORY_PAGE_SIZE_MAX}`,
} as const;

// Errors
export const DELIVERIES_ERROR_MESSAGES = {
  ORDER_NOT_FOUND: ORDER_NOT_FOUND_MESSAGE,
  WRONG_STEP: 'Заказ уже на другом этапе или отменён',
  // The order row is held by another operation (a cancellation at the same moment).
  BUSY: 'Заказ сейчас обновляется. Попробуйте ещё раз',
  WRONG_CODE: (attemptsLeft: number) => `Неверный код. Осталось попыток: ${attemptsLeft}`,
  CODE_LOCKED: (minutesLeft: number) =>
    `Слишком много неверных попыток. Попробуйте через ${minutesLeft} мин.`,
} as const;
