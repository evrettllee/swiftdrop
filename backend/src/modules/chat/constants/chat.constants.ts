import { MESSAGE_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import { ORDER_BUSY_MESSAGE, ORDER_NOT_FOUND_MESSAGE } from '@/common/constants/orders.constants';
import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';

// Routes: the chat of an order lives under the order.
export const CHAT_ROUTES = {
  BASE: 'orders',
  MESSAGES: `${ORDER_ID_ROUTE_PARAM}/messages`,
  READ: `${ORDER_ID_ROUTE_PARAM}/messages/read`,
} as const;

// History pages, from the newest message back.
export const CHAT_PAGE_SIZE_MIN = 1;
export const CHAT_PAGE_SIZE_DEFAULT = 30;
export const CHAT_PAGE_SIZE_MAX = 50;

// Sending: per user, not per address, so the two sides of one network do not share a limit.
export const CHAT_SEND_THROTTLE_KEY = 'chat-send';
export const CHAT_SEND_THROTTLE_LIMIT = 20;
export const CHAT_SEND_THROTTLE_TTL_MS = MS_PER_MINUTE;
// Postgres text cannot hold this character: the insert would fail with 500.
export const NUL_CHARACTER = '\u0000';

// The order still waits for its courier: a message is refused as not open yet, not as closed.
export const CHAT_NOT_OPEN_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
] as const;

// Validation
export const CHAT_VALIDATION_MESSAGES = {
  BEFORE_ID_INVALID: 'Некорректный номер сообщения',
  LIMIT_INVALID: `Размер страницы: от ${CHAT_PAGE_SIZE_MIN} до ${CHAT_PAGE_SIZE_MAX}`,
  CONTENT_INVALID: 'Сообщение должно быть текстом',
  CONTENT_EMPTY: 'Сообщение не может быть пустым',
  CONTENT_TOO_LONG: `Сообщение должно содержать не больше ${MESSAGE_FIELD_LENGTH.CONTENT} символов`,
  CONTENT_FORBIDDEN_CHARACTER: 'Сообщение содержит недопустимый символ',
  UP_TO_MESSAGE_ID_INVALID: 'Некорректный номер сообщения',
} as const;

// Errors: a foreign order answers as GET /orders/:id does, so it cannot be told from a missing one.
export const CHAT_ERROR_MESSAGES = {
  ORDER_NOT_FOUND: ORDER_NOT_FOUND_MESSAGE,
  CHAT_CLOSED: 'Чат закрыт: заказ завершён',
  // No courier has taken the order yet, so there is no one to write to.
  CHAT_NOT_OPEN: 'Чат откроется, когда курьер примет заказ',
  // The order row is held by a status change: the same answer as other operations on an order.
  BUSY: ORDER_BUSY_MESSAGE,
  TOO_MANY_MESSAGES: 'Слишком много сообщений. Подождите минуту',
} as const;
