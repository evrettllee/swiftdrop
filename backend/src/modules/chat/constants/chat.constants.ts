import { ORDER_NOT_FOUND_MESSAGE } from '../../../common/constants/orders.constants';
import { ORDER_ID_ROUTE_PARAM } from '../../orders/constants/orders.constants';

// Routes: the chat of an order lives under the order.
export const CHAT_ROUTES = {
  BASE: 'orders',
  MESSAGES: `${ORDER_ID_ROUTE_PARAM}/messages`,
} as const;

// History pages, from the newest message back.
export const CHAT_PAGE_SIZE_MIN = 1;
export const CHAT_PAGE_SIZE_DEFAULT = 30;
export const CHAT_PAGE_SIZE_MAX = 50;

// Validation
export const CHAT_VALIDATION_MESSAGES = {
  BEFORE_ID_INVALID: 'Некорректный номер сообщения',
  LIMIT_INVALID: `Размер страницы: от ${CHAT_PAGE_SIZE_MIN} до ${CHAT_PAGE_SIZE_MAX}`,
} as const;

// Errors: a foreign order answers as GET /orders/:id does, so it cannot be told from a missing one.
export const CHAT_ERROR_MESSAGES = {
  ORDER_NOT_FOUND: ORDER_NOT_FOUND_MESSAGE,
} as const;
