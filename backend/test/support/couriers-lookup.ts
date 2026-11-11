import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Database } from '@/database/database.module';
import { users } from '@/database/schema';
import { MANAGER_COURIERS_ROUTES } from '@/modules/manager/constants/manager-couriers-map.constants';
import { addCourierSession } from './assignment';
import { COOKIE_HEADER } from './auth';
import {
  CAR,
  COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  getCourierMe,
} from './couriers';
import { MINSK_PICKUP } from './fixtures';
import { getApi } from './http';
import { blockUser } from './users';

function account(index: number, lastName: string) {
  return {
    ...COURIER_ACCOUNT,
    firstName: 'Курьер',
    lastName,
    email: `lookup-courier-${index}@example.com`,
    phone: `+37529200000${index}`,
  };
}

export const LOOKUP_WITH_CAR = account(1, 'Абрамов');
export const LOOKUP_NO_VEHICLE = account(2, 'Борисов');
export const LOOKUP_BLOCKED = account(3, 'Васильев');
const DELETED = account(4, 'Григорьев');

export type LookupCourierIds = Record<'withCar' | 'noVehicle' | 'blocked' | 'deleted', number>;

async function addBareCourier(
  app: NestExpressApplication,
  db: Database,
  target: typeof COURIER_ACCOUNT,
): Promise<{ courierProfileId: number; cookies: string }> {
  const cookies = await createCourier(app, db, target);
  await getCourierMe(app, cookies).expect(HttpStatus.OK);

  return { courierProfileId: await findCourierProfileId(db, target.email), cookies };
}

export async function seedLookupCouriers(
  app: NestExpressApplication,
  db: Database,
): Promise<{ ids: LookupCourierIds; courierCookies: string }> {
  const withCar = await addCourierSession(app, db, LOOKUP_WITH_CAR, CAR, MINSK_PICKUP);
  const noVehicle = await addBareCourier(app, db, LOOKUP_NO_VEHICLE);
  const blocked = await addBareCourier(app, db, LOOKUP_BLOCKED);
  const deleted = await addBareCourier(app, db, DELETED);
  await blockUser(db, LOOKUP_BLOCKED.email);
  await db.update(users).set({ deletedAt: new Date() }).where(eq(users.email, DELETED.email));

  return {
    ids: {
      withCar: withCar.courierProfileId,
      noVehicle: noVehicle.courierProfileId,
      blocked: blocked.courierProfileId,
      deleted: deleted.courierProfileId,
    },
    courierCookies: withCar.cookies,
  };
}

export function getCourierLookup(
  app: NestExpressApplication,
  cookies: string | null,
  query: Record<string, string> = {},
) {
  const request = getApi(
    app,
    `${MANAGER_COURIERS_ROUTES.BASE}/${MANAGER_COURIERS_ROUTES.LOOKUP}`,
  ).query(query);

  return cookies === null ? request : request.set(COOKIE_HEADER, cookies);
}
