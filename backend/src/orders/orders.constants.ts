import { NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '../common/constants/person-validation';
import { MS_PER_MINUTE } from '../common/constants/time';
import { ORDER_STATUS } from '../common/enums/order-status.enum';
import type { OrderStatus } from '../common/enums/order-status.enum';

// Routes
export const ORDERS_ROUTES = {
  BASE: 'orders',
  BY_ID: ':orderId',
  CANCEL: ':orderId/cancel',
} as const;

// Statuses
// The client may cancel an order until the courier picks the parcel up.
export const CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
  ORDER_STATUS.COURIER_ASSIGNED,
];

// Orders that are not finished yet: the "Active" tab of the list.
export const ACTIVE_STATUSES: readonly OrderStatus[] = [
  ...CANCELLABLE_STATUSES,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
];

// Finished orders: the "Finished" tab of the list; only these can be repeated.
export const FINISHED_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REJECTED,
];

// List
export const ORDER_LIST_FILTER = {
  ALL: 'all',
  ACTIVE: 'active',
  FINISHED: 'finished',
} as const;

export const ORDER_LIST_FILTER_VALUES = ['all', 'active', 'finished'] as const;

export const ORDERS_FIRST_PAGE = 1;
export const ORDERS_PAGE_SIZE_DEFAULT = 5;
export const ORDERS_PAGE_SIZE_MAX = 50;

// Payment
// An unpaid order is cancelled after this time (a Stripe Checkout Session lives 30 minutes at least).
export const UNPAID_ORDER_TTL_MINUTES = 30;
export const UNPAID_ORDER_TTL_MS = UNPAID_ORDER_TTL_MINUTES * MS_PER_MINUTE;

// Address limits: match the columns of the addresses table.
export const CITY_MAX_LENGTH = 100;
export const STREET_MAX_LENGTH = 150;
export const HOUSE_MAX_LENGTH = 20;
export const APARTMENT_MAX_LENGTH = 20;

// Validation
export const ORDERS_VALIDATION_MESSAGES = {
  CITY_REQUIRED: 'Укажите город',
  CITY_TOO_LONG: `Город должен содержать не больше ${CITY_MAX_LENGTH} символов`,
  STREET_REQUIRED: 'Укажите улицу',
  STREET_TOO_LONG: `Улица должна содержать не больше ${STREET_MAX_LENGTH} символов`,
  HOUSE_REQUIRED: 'Укажите номер дома',
  HOUSE_TOO_LONG: `Номер дома должен содержать не больше ${HOUSE_MAX_LENGTH} символов`,
  APARTMENT_TOO_LONG: `Квартира должна содержать не больше ${APARTMENT_MAX_LENGTH} символов`,
  RECIPIENT_NAME_TOO_SHORT: `Имя получателя должно содержать минимум ${NAME_MIN_LENGTH} символа`,
  RECIPIENT_NAME_TOO_LONG: `Имя получателя должно содержать не больше ${NAME_MAX_LENGTH} символов`,
  RECIPIENT_NAME_INVALID: 'Имя получателя может содержать только буквы, пробел, дефис и апостроф',
  PAGE_INVALID: 'Некорректный номер страницы',
  LIMIT_INVALID: `Размер страницы: от 1 до ${ORDERS_PAGE_SIZE_MAX}`,
  FILTER_INVALID: 'Неизвестный фильтр заказов',
  ORDER_ID_INVALID: 'Некорректный номер заказа',
} as const;

// Errors
export const ORDERS_ERROR_MESSAGES = {
  NOT_FOUND: 'Заказ не найден',
  CANNOT_CANCEL: 'Заказ уже нельзя отменить: курьер забрал посылку',
  CREATE_FAILED: 'Не удалось оформить заказ',
  ALREADY_FINISHED: 'Заказ уже завершён или отменён',
} as const;

// Orders store money as numeric(10,2) strings.
export const PRICE_FRACTION_DIGITS = 2;
