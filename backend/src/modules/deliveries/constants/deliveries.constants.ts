import { LIST_VALIDATION_MESSAGES } from '@/common/constants/list.constants';
import {
  COURIER_ACTIVE_ORDER_STATUSES,
  COURIER_HISTORY_STATUSES,
  ORDER_BUSY_MESSAGE,
  ORDER_NOT_FOUND_MESSAGE,
} from '@/common/constants/orders.constants';
import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { ROUTE_PATH_SEGMENT } from '@/modules/routing/constants/routing.constants';

// Routes
export const COURIER_ORDERS_ROUTES = {
  BASE: 'couriers/me/orders',
  CURRENT: 'current',
  CURRENT_ROUTE: `current/${ROUTE_PATH_SEGMENT}`,
  HISTORY: 'history',
  PICKUP: `${ORDER_ID_ROUTE_PARAM}/pickup`,
  DEPART: `${ORDER_ID_ROUTE_PARAM}/depart`,
  DELIVER: `${ORDER_ID_ROUTE_PARAM}/deliver`,
  // A finished order of the history; declared after CURRENT and HISTORY, which it would catch.
  ORDER: ORDER_ID_ROUTE_PARAM,
  ORDER_ROUTE: `${ORDER_ID_ROUTE_PARAM}/${ROUTE_PATH_SEGMENT}`,
} as const;

export const COURIER_STATS_ROUTES = {
  BASE: 'couriers/me/stats',
  TODAY: 'today',
} as const;

// The client's side of the delivery lives under the orders of the client.
export const CLIENT_ORDER_COURIER_ROUTES = {
  BASE: 'orders',
  COURIER: `${ORDER_ID_ROUTE_PARAM}/courier`,
  ROUTE: `${ORDER_ID_ROUTE_PARAM}/${ROUTE_PATH_SEGMENT}`,
} as const;

// Delivery code
// The recipient tells the courier these digits at the door, so the code is short.
export const DELIVERY_CODE_LENGTH = 4;
export const DELIVERY_CODE_RANGE = 10 ** DELIVERY_CODE_LENGTH;
export const DELIVERY_CODE_PAD = '0';
export const DELIVERY_CODE_PATTERN = new RegExp(`^[0-9]{${DELIVERY_CODE_LENGTH}}$`);
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

// The phone of the courier and where they are: only while the order is with them. After the
// delivery the client keeps the name, but can no longer call or follow the courier.
export const COURIER_CONTACT_STATUSES: readonly OrderStatus[] = COURIER_ACTIVE_ORDER_STATUSES;

// A position older than this is shown to the client as lost connection. Only the client view uses
// it: assignment keeps its own freshness (COURIER_LOCATION_FRESH_MS).
export const COURIER_LOCATION_STALE_MS = MS_PER_MINUTE;

// The code is shown only once the parcel is picked up, when the order can no longer be cancelled.
export const DELIVERY_CODE_VISIBLE_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
];

// The courier's last name is cut to its first letter and this mark.
export const LAST_NAME_INITIAL_MARK = '.';

// History
// Orders that ended while they were with the courier.
export const HISTORY_STATUSES: readonly OrderStatus[] = COURIER_HISTORY_STATUSES;
// The stages of an order the courier took part in: a finished order shows only these.
export const COURIER_STAGE_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.COURIER_ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
];
export const HISTORY_PAGE_SIZE_DEFAULT = 10;

export const HISTORY_SORT_KEY = {
  ID: 'id',
  FINISHED_AT: 'finishedAt',
} as const;

// Validation
export const DELIVERIES_VALIDATION_MESSAGES = {
  CODE_INVALID: `Введите ${DELIVERY_CODE_LENGTH} цифры кода`,
  PAGE_INVALID: LIST_VALIDATION_MESSAGES.PAGE_INVALID,
  LIMIT_INVALID: LIST_VALIDATION_MESSAGES.LIMIT_INVALID,
} as const;

// Errors
export const DELIVERIES_ERROR_MESSAGES = {
  ORDER_NOT_FOUND: ORDER_NOT_FOUND_MESSAGE,
  WRONG_STEP: 'Заказ уже на другом этапе или отменён',
  // The order row is held by another operation (a cancellation at the same moment).
  BUSY: ORDER_BUSY_MESSAGE,
  WRONG_CODE: (attemptsLeft: number) => `Неверный код. Осталось попыток: ${attemptsLeft}`,
  CODE_LOCKED: (minutesLeft: number) =>
    `Слишком много неверных попыток. Попробуйте через ${minutesLeft} мин.`,
} as const;
