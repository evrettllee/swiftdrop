import { z } from 'zod';
import { formatShortAddress } from '@/entities/order';
import {
  COURIER_ORDERS_API_PATHS,
  courierHistoryPageSchema,
  getCurrentCourierOrder,
  type HttpOptions,
  http,
  orderListItemSchema,
  ORDERS_API_PATHS,
} from '@/shared/api';
import { ROLE } from '@/shared/session';
import { type AuthorRole, RECENT_ORDERS_LIMIT } from '../config/new-ticket';
import type { OrderSummary } from '../lib/ticket-lines';

export type RecentOrder = OrderSummary & { orderId: number };

const ordersPageSchema = z.object({ items: z.array(orderListItemSchema) });

const FIRST_PAGE = '1';
const ALL_ORDERS = 'all';

function pageQuery(): string {
  return new URLSearchParams({
    page: FIRST_PAGE,
    limit: String(RECENT_ORDERS_LIMIT),
  }).toString();
}

async function clientOrders(options: HttpOptions): Promise<RecentOrder[]> {
  const query = `${pageQuery()}&filter=${ALL_ORDERS}`;
  const page = ordersPageSchema.parse(
    await http.get(`${ORDERS_API_PATHS.ORDERS}?${query}`, options),
  );

  return page.items.map((order) => ({
    orderId: order.orderId,
    status: order.status,
    at: order.createdAt,
    address: formatShortAddress(order.delivery),
  }));
}

async function courierOrders(options: HttpOptions): Promise<RecentOrder[]> {
  const [current, history] = await Promise.all([
    getCurrentCourierOrder(options.signal),
    http.get(`${COURIER_ORDERS_API_PATHS.HISTORY}?${pageQuery()}`, options),
  ]);
  const finished = courierHistoryPageSchema.parse(history).items.map((order) => ({
    orderId: order.orderId,
    status: order.status,
    at: order.finishedAt,
    address: formatShortAddress(order.delivery),
  }));
  const active =
    current === null
      ? []
      : [
          {
            orderId: current.orderId,
            status: current.status,
            at: null,
            address: formatShortAddress(current.delivery),
          },
        ];

  return [...active, ...finished].slice(0, RECENT_ORDERS_LIMIT);
}

export function getRecentOrders(role: AuthorRole, options: HttpOptions): Promise<RecentOrder[]> {
  return role === ROLE.COURIER ? courierOrders(options) : clientOrders(options);
}
