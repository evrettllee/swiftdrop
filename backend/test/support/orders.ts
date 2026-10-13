import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { OrderStatus } from '../../src/common/enums/order-status.enum';
import type { Database } from '../../src/database/database.module';
import { orders } from '../../src/database/schema';
import { ORDERS_ROUTES } from '../../src/modules/orders/constants/orders.constants';
import { COOKIE_HEADER, type registerUser, validRegistration } from './auth';
import { VALID_ORDER } from './fixtures';
import { getApi, postApi } from './http';

export type Cookies = Awaited<ReturnType<typeof registerUser>>['cookies'];

// Registration data of a second client, to check that clients do not see each other's orders.
export const SECOND_CLIENT = {
  ...validRegistration,
  email: 'anna@example.com',
  phone: '+375297654321',
};

export function postOrder(
  app: NestExpressApplication,
  cookies: Cookies,
  body: Record<string, unknown>,
) {
  return postApi(app, ORDERS_ROUTES.BASE).set(COOKIE_HEADER, cookies).send(body);
}

// Places orders one after another, so their creation order is the order of the returned ids.
export async function placeOrders(
  app: NestExpressApplication,
  cookies: Cookies,
  count: number,
): Promise<number[]> {
  const ids: number[] = [];

  for (let index = 0; index < count; index += 1) {
    const response = await postOrder(app, cookies, VALID_ORDER).expect(201);
    ids.push(response.body.orderId);
  }

  return ids;
}

export function getOrders(
  app: NestExpressApplication,
  cookies: Cookies,
  params: Record<string, string | number> = {},
) {
  return getApi(app, ORDERS_ROUTES.BASE).set(COOKIE_HEADER, cookies).query(params);
}

export function cancelOrder(
  app: NestExpressApplication,
  cookies: Cookies,
  orderId: number | string,
) {
  const path = `${ORDERS_ROUTES.BASE}/${ORDERS_ROUTES.CANCEL.replace(':orderId', String(orderId))}`;

  return postApi(app, path).set(COOKIE_HEADER, cookies);
}

export async function setOrderStatus(
  db: Database,
  orderId: number,
  status: OrderStatus,
): Promise<void> {
  await db.update(orders).set({ status }).where(eq(orders.orderId, orderId));
}

export async function readOrderStatus(db: Database, orderId: number): Promise<OrderStatus> {
  const [order] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.orderId, orderId));

  return order.status;
}
