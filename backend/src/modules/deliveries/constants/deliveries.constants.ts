import { ORDER_NOT_FOUND_MESSAGE } from '../../../common/constants/orders.constants';
import { ORDER_ID_ROUTE_PARAM } from '../../orders/constants/orders.constants';

// Routes
export const COURIER_ORDERS_ROUTES = {
  BASE: 'couriers/me/orders',
  CURRENT: 'current',
  PICKUP: `${ORDER_ID_ROUTE_PARAM}/pickup`,
  DEPART: `${ORDER_ID_ROUTE_PARAM}/depart`,
} as const;

// Delivery code
// The recipient tells the courier these digits at the door, so the code is short.
export const DELIVERY_CODE_LENGTH = 4;
export const DELIVERY_CODE_RANGE = 10 ** DELIVERY_CODE_LENGTH;
export const DELIVERY_CODE_PAD = '0';

// Errors
export const DELIVERIES_ERROR_MESSAGES = {
  ORDER_NOT_FOUND: ORDER_NOT_FOUND_MESSAGE,
  WRONG_STEP: 'Заказ уже на другом этапе или отменён',
  // The order row is held by another operation (a cancellation at the same moment).
  BUSY: 'Заказ сейчас обновляется. Попробуйте ещё раз',
} as const;
