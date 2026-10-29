import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';

export const MANAGER_ORDERS_ROUTES = {
  BASE: 'manager/orders',
  COUNTS: 'counts',
} as const;

export const MANAGER_ORDERS_PAGE_SIZE_DEFAULT = 20;

export const MANAGER_STATUS_GROUP = {
  ATTENTION: 'attention',
  ACTIVE: 'active',
  AWAITING_PAYMENT: 'awaiting_payment',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
} as const;

export const MANAGER_STATUS_GROUP_VALUES = [
  MANAGER_STATUS_GROUP.ATTENTION,
  MANAGER_STATUS_GROUP.ACTIVE,
  MANAGER_STATUS_GROUP.AWAITING_PAYMENT,
  MANAGER_STATUS_GROUP.FINISHED,
  MANAGER_STATUS_GROUP.CANCELLED,
] as const;

export type ManagerStatusGroup = (typeof MANAGER_STATUS_GROUP_VALUES)[number];

export const MANAGER_STATUS_GROUP_STATUSES: Record<ManagerStatusGroup, readonly OrderStatus[]> = {
  attention: [ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT],
  active: [
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.COURIER_ASSIGNED,
    ORDER_STATUS.PICKED_UP,
    ORDER_STATUS.IN_TRANSIT,
  ],
  awaiting_payment: [ORDER_STATUS.PENDING],
  finished: [ORDER_STATUS.DELIVERED],
  cancelled: [ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED],
};

export const PAYMENT_STATE = {
  PAID: 'paid',
  REFUNDED: 'refunded',
  UNPAID: 'unpaid',
} as const;

export const PAYMENT_STATE_VALUES = [
  PAYMENT_STATE.PAID,
  PAYMENT_STATE.REFUNDED,
  PAYMENT_STATE.UNPAID,
] as const;

export type PaymentState = (typeof PAYMENT_STATE_VALUES)[number];

export const MANAGER_SORT_KEY = {
  CREATED_AT: 'createdAt',
  PRICE: 'price',
  STATUS_CHANGED_AT: 'statusChangedAt',
} as const;

export const FRAGILE_ONLY = 'true';

export const NUMERIC_SEARCH = /^[\d\s+\-()]+$/;
export const NON_DIGITS = /\D/g;
export const ORDER_ID_MAX_DIGITS = 10;
export const PHONE_PREFIX = '+';

export const MANAGER_ORDERS_VALIDATION_MESSAGES = {
  COURIER_ID_INVALID: 'Некорректный номер курьера',
  FRAGILE_INVALID: 'Фильтр хрупких посылок принимает только true',
} as const;
