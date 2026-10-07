import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDERS_ROUTES } from '../../src/orders/orders.constants';
import { COOKIE_HEADER, type registerUser, validRegistration } from './auth';
import { VALID_ORDER } from './fixtures';
import { postApi } from './http';

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
