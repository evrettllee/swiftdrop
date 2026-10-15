import { z } from 'zod';
import { http, type HttpOptions, orderListItemSchema, ORDERS_API_PATHS } from '@/shared/api';
import { ORDERS_PAGE_SIZE } from '../config/list';
import type { OrderListFilter } from '../model/order-list';

// Response of GET /api/orders
const ordersPageSchema = z.object({
  items: z.array(orderListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

type OrdersPage = z.infer<typeof ordersPageSchema>;

type OrdersQuery = {
  page: number;
  filter: OrderListFilter;
  limit?: number;
};

export async function listOrders(
  { page, filter, limit = ORDERS_PAGE_SIZE }: OrdersQuery,
  options: HttpOptions = {},
): Promise<OrdersPage> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    filter,
  });

  return ordersPageSchema.parse(await http.get(`${ORDERS_API_PATHS.ORDERS}?${query}`, options));
}
