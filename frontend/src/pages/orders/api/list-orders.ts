import { z } from 'zod';
import { http, orderListItemSchema, ORDERS_API_PATHS } from '@/shared/api';
import { serializeListParam } from '@/shared/lib/list-params';
import { ORDER_COUNT_PROBE_LIMIT, ORDERS_FIRST_PAGE, ORDERS_PAGE_SIZE } from '../config/list';
import type { OrdersParams } from '../config/list-params';

const ordersPageSchema = z.object({
  items: z.array(orderListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  until: z.number().nullable(),
});

const ordersCursorPageSchema = z.object({
  items: z.array(orderListItemSchema),
  nextCursor: z.string().nullable(),
  total: z.number().optional(),
});

export type OrdersPage = z.infer<typeof ordersPageSchema>;
export type OrdersCursorPage = z.infer<typeof ordersCursorPageSchema>;
export type OrdersQuery = Omit<OrdersParams, 'page'>;

function queryOf(query: OrdersQuery, extra: Record<string, string | number>): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    const serialized = serializeListParam(value);

    if (serialized !== null) {
      params.set(key, serialized);
    }
  }

  for (const [key, value] of Object.entries(extra)) {
    params.set(key, String(value));
  }

  return params;
}

export async function getOrdersPage(
  query: OrdersQuery,
  page: number,
  signal: AbortSignal,
  { limit = ORDERS_PAGE_SIZE, until = null }: { limit?: number; until?: number | null } = {},
): Promise<OrdersPage> {
  const params = queryOf(query, until === null ? { page, limit } : { page, limit, until });

  return ordersPageSchema.parse(await http.get(`${ORDERS_API_PATHS.ORDERS}?${params}`, { signal }));
}

export async function getOrdersCursorPage(
  query: OrdersQuery,
  cursor: string,
  signal: AbortSignal,
): Promise<OrdersCursorPage> {
  const params = queryOf(query, { cursor, limit: ORDERS_PAGE_SIZE });

  return ordersCursorPageSchema.parse(
    await http.get(`${ORDERS_API_PATHS.ORDERS}?${params}`, { signal }),
  );
}

export async function countOrders(query: OrdersQuery, signal: AbortSignal): Promise<number> {
  const page = await getOrdersPage(query, ORDERS_FIRST_PAGE, signal, {
    limit: ORDER_COUNT_PROBE_LIMIT,
  });

  return page.total;
}
