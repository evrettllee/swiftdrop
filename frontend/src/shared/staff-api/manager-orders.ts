import { z } from 'zod';
import { dateSchema, http, orderStatusSchema } from '@/shared/api';
import {
  LIST_VALUES_SEPARATOR,
  MANAGER_FLAG_TRUE,
  MANAGER_ORDERS_PARAM,
  PAYMENT_STATE,
  type ManagerOrdersSort,
  type ManagerStatusGroup,
  type PaymentState,
} from './manager-orders-params';

export const MANAGER_ORDERS_API_PATHS = {
  ORDERS: '/manager/orders',
  COUNTS: '/manager/orders/counts',
  EXPORT: '/manager/orders/export',
} as const;

const streetSchema = z.object({ street: z.string(), house: z.string() });

export const managerOrderListItemSchema = z.object({
  id: z.number(),
  createdAt: dateSchema,
  status: orderStatusSchema,
  statusChangedAt: dateSchema,
  price: z.number(),
  client: z.object({ name: z.string(), phone: z.string().nullable() }),
  route: z.object({ from: streetSchema, to: streetSchema }),
  courier: z.object({ id: z.number(), name: z.string() }).nullable(),
  fragile: z.boolean(),
  paymentState: z.enum(PAYMENT_STATE),
});

export type ManagerOrderListItem = z.infer<typeof managerOrderListItemSchema>;

export const managerOrdersPageSchema = z.object({
  items: z.array(managerOrderListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  until: z.number().nullable(),
});

export type ManagerOrdersPage = z.infer<typeof managerOrdersPageSchema>;

export const managerOrdersCursorPageSchema = z.object({
  items: z.array(managerOrderListItemSchema),
  nextCursor: z.string().nullable(),
  total: z.number().optional(),
});

export type ManagerOrdersCursorPage = z.infer<typeof managerOrdersCursorPageSchema>;

export const managerOrderCountsSchema = z.object({
  attention: z.number(),
  active: z.number(),
  awaitingPayment: z.number(),
  finished: z.number(),
  cancelled: z.number(),
  all: z.number(),
});

export type ManagerOrderCounts = z.infer<typeof managerOrderCountsSchema>;

export type ManagerOrdersFilter = {
  from: string | null;
  to: string | null;
  courierId: number | null;
  payment: readonly PaymentState[];
  fragile: boolean;
  search: string | null;
};

export type ManagerOrdersListQuery = ManagerOrdersFilter & {
  status: ManagerStatusGroup | null;
  sort: ManagerOrdersSort;
};

export type ManagerOrdersPagination =
  | { mode: 'page'; page: number; limit: number; until: number | null }
  | { mode: 'cursor'; cursor: string; limit: number };

export function setIf(query: URLSearchParams, name: string, value: string | number | null): void {
  if (value !== null && value !== '') {
    query.set(name, String(value));
  }
}

function filterQuery(filter: ManagerOrdersFilter): URLSearchParams {
  const query = new URLSearchParams();
  setIf(query, MANAGER_ORDERS_PARAM.FROM, filter.from);
  setIf(query, MANAGER_ORDERS_PARAM.TO, filter.to);
  setIf(query, MANAGER_ORDERS_PARAM.COURIER_ID, filter.courierId);
  setIf(query, MANAGER_ORDERS_PARAM.PAYMENT, filter.payment.join(LIST_VALUES_SEPARATOR));
  setIf(query, MANAGER_ORDERS_PARAM.FRAGILE, filter.fragile ? MANAGER_FLAG_TRUE : null);
  setIf(query, MANAGER_ORDERS_PARAM.SEARCH, filter.search);

  return query;
}

export function listQuery(list: ManagerOrdersListQuery): URLSearchParams {
  const query = filterQuery(list);
  setIf(query, MANAGER_ORDERS_PARAM.STATUS, list.status);
  query.set(MANAGER_ORDERS_PARAM.SORT, list.sort);

  return query;
}

export function buildManagerOrdersQuery(
  list: ManagerOrdersListQuery,
  pagination: ManagerOrdersPagination,
): URLSearchParams {
  const query = listQuery(list);
  query.set(MANAGER_ORDERS_PARAM.LIMIT, String(pagination.limit));

  if (pagination.mode === 'page') {
    query.set(MANAGER_ORDERS_PARAM.PAGE, String(pagination.page));
    setIf(query, MANAGER_ORDERS_PARAM.UNTIL, pagination.until);
  } else {
    query.set(MANAGER_ORDERS_PARAM.CURSOR, pagination.cursor);
  }

  return query;
}

export async function getManagerOrdersPage(
  list: ManagerOrdersListQuery,
  pagination: Extract<ManagerOrdersPagination, { mode: 'page' }>,
  signal?: AbortSignal,
): Promise<ManagerOrdersPage> {
  const query = buildManagerOrdersQuery(list, pagination);

  return managerOrdersPageSchema.parse(
    await http.get(`${MANAGER_ORDERS_API_PATHS.ORDERS}?${query.toString()}`, { signal }),
  );
}

export async function getManagerOrdersCursorPage(
  list: ManagerOrdersListQuery,
  pagination: Extract<ManagerOrdersPagination, { mode: 'cursor' }>,
  signal?: AbortSignal,
): Promise<ManagerOrdersCursorPage> {
  const query = buildManagerOrdersQuery(list, pagination);

  return managerOrdersCursorPageSchema.parse(
    await http.get(`${MANAGER_ORDERS_API_PATHS.ORDERS}?${query.toString()}`, { signal }),
  );
}

export async function getManagerOrderCounts(
  signal?: AbortSignal,
  filter?: ManagerOrdersFilter,
  until: number | null = null,
): Promise<ManagerOrderCounts> {
  const query = filter === undefined ? new URLSearchParams() : filterQuery(filter);
  setIf(query, MANAGER_ORDERS_PARAM.UNTIL, until);
  const suffix = query.size === 0 ? '' : `?${query.toString()}`;

  return managerOrderCountsSchema.parse(
    await http.get(`${MANAGER_ORDERS_API_PATHS.COUNTS}${suffix}`, { signal }),
  );
}
