import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import type { Database } from '@/database/database.module';
import { MANAGER_ORDERS_ROUTES } from '@/modules/manager/constants/manager-orders.constants';
import { COOKIE_HEADER } from './auth';
import { getApi } from './http';
import { createUserWithRole, MANAGER_ACCOUNT } from './users';

export type ManagerListBody = {
  items: { id: number; status: string; statusChangedAt: string; paymentState: string }[];
  total?: number;
  until?: number | null;
  nextCursor?: string | null;
};

export function createManager(app: NestExpressApplication, db: Database): Promise<string> {
  return createUserWithRole(app, db, MANAGER_ACCOUNT, ROLE.MANAGER);
}

export function getManagerOrders(
  app: NestExpressApplication,
  cookies: string,
  query: Record<string, string | number> = {},
) {
  return getApi(app, MANAGER_ORDERS_ROUTES.BASE).set(COOKIE_HEADER, cookies).query(query);
}

export function getManagerCounts(
  app: NestExpressApplication,
  cookies: string,
  query: Record<string, string | number> = {},
) {
  return getApi(app, `${MANAGER_ORDERS_ROUTES.BASE}/${MANAGER_ORDERS_ROUTES.COUNTS}`)
    .set(COOKIE_HEADER, cookies)
    .query(query);
}

export function idsOf(body: ManagerListBody): number[] {
  return body.items.map((item) => item.id);
}
