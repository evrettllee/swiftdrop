import { ORDER_STATUS, type OrderStatus } from '@/shared/api';
import {
  MANAGER_ORDERS_SORT,
  MANAGER_STATUS_GROUP,
  type ManagerOrderCounts,
  type ManagerOrdersSort,
  type ManagerStatusGroup,
} from '@/shared/staff-api';
import { MS_PER_MINUTE } from '@/shared/config';

export const ORDERS_TAB = {
  ATTENTION: 'attention',
  ACTIVE: 'active',
  AWAITING_PAYMENT: 'awaiting_payment',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
  ALL: 'all',
} as const;

export type OrdersTab = (typeof ORDERS_TAB)[keyof typeof ORDERS_TAB];

export const ORDERS_TABS: readonly OrdersTab[] = [
  ORDERS_TAB.ATTENTION,
  ORDERS_TAB.ACTIVE,
  ORDERS_TAB.AWAITING_PAYMENT,
  ORDERS_TAB.FINISHED,
  ORDERS_TAB.CANCELLED,
  ORDERS_TAB.ALL,
];

export const TAB_STATUS_GROUP: Record<OrdersTab, ManagerStatusGroup | null> = {
  [ORDERS_TAB.ATTENTION]: MANAGER_STATUS_GROUP.ATTENTION,
  [ORDERS_TAB.ACTIVE]: MANAGER_STATUS_GROUP.ACTIVE,
  [ORDERS_TAB.AWAITING_PAYMENT]: MANAGER_STATUS_GROUP.AWAITING_PAYMENT,
  [ORDERS_TAB.FINISHED]: MANAGER_STATUS_GROUP.FINISHED,
  [ORDERS_TAB.CANCELLED]: MANAGER_STATUS_GROUP.CANCELLED,
  [ORDERS_TAB.ALL]: null,
};

export const TAB_COUNT_KEY: Record<OrdersTab, keyof ManagerOrderCounts> = {
  [ORDERS_TAB.ATTENTION]: 'attention',
  [ORDERS_TAB.ACTIVE]: 'active',
  [ORDERS_TAB.AWAITING_PAYMENT]: 'awaitingPayment',
  [ORDERS_TAB.FINISHED]: 'finished',
  [ORDERS_TAB.CANCELLED]: 'cancelled',
  [ORDERS_TAB.ALL]: 'all',
};

export const TAB_STATUSES: Record<OrdersTab, readonly OrderStatus[] | null> = {
  [ORDERS_TAB.ATTENTION]: [ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT],
  [ORDERS_TAB.ACTIVE]: [
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.COURIER_ASSIGNED,
    ORDER_STATUS.PICKED_UP,
    ORDER_STATUS.IN_TRANSIT,
  ],
  [ORDERS_TAB.AWAITING_PAYMENT]: [ORDER_STATUS.PENDING],
  [ORDERS_TAB.FINISHED]: [ORDER_STATUS.DELIVERED],
  [ORDERS_TAB.CANCELLED]: [ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED],
  [ORDERS_TAB.ALL]: null,
};

const COMMON_SORTS: readonly ManagerOrdersSort[] = [
  MANAGER_ORDERS_SORT.NEWEST,
  MANAGER_ORDERS_SORT.OLDEST,
  MANAGER_ORDERS_SORT.PRICE_HIGH,
  MANAGER_ORDERS_SORT.PRICE_LOW,
];

export function tabSorts(tab: OrdersTab): readonly ManagerOrdersSort[] {
  return tab === ORDERS_TAB.ATTENTION
    ? [MANAGER_ORDERS_SORT.LONGEST_WAITING, ...COMMON_SORTS]
    : COMMON_SORTS;
}

export function defaultTabSort(tab: OrdersTab): ManagerOrdersSort {
  return tabSorts(tab)[0];
}

export const PAGE_SIZES = [20, 50, 100] as const;

export type PageSize = (typeof PAGE_SIZES)[number];

export const DEFAULT_PAGE_SIZE: PageSize = 20;

export const LONG_WAIT_MS = 15 * MS_PER_MINUTE;

export const PERIOD_PRESET = {
  ALL: 'all',
  WEEK: 'week',
  MONTH: 'month',
  CUSTOM: 'custom',
} as const;

export type PeriodPreset = (typeof PERIOD_PRESET)[keyof typeof PERIOD_PRESET];

export const PERIOD_PRESET_DAYS = {
  [PERIOD_PRESET.WEEK]: 7,
  [PERIOD_PRESET.MONTH]: 30,
} as const;

export const ORDERS_TABS_ID_PREFIX = 'manager-orders';

export const COUNTS_DRAFT_DELAY_MS = 300;
