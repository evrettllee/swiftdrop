import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ROLE } from '@/common/enums/role.enum';
import { VEHICLE_TYPE } from '@/common/enums/vehicle-type.enum';
import type { GeoPoint } from '@/common/schemas/geo-point.schema';
import type { Database } from '@/database/database.module';
import { courierProfiles, orders, users } from '@/database/schema';
import { COURIERS_ROUTES } from '@/modules/couriers/constants/couriers.constants';
import { COOKIE_HEADER, validRegistration } from './auth';
import { getApi, putApi } from './http';
import { createUserWithRole } from './users';

export const COURIER_ACCOUNT = {
  firstName: 'Дмитрий',
  lastName: 'Соколов',
  email: 'courier@example.com',
  phone: '+375331112233',
  password: validRegistration.password,
};

// A second courier, for tests that choose between two.
export const SECOND_COURIER_ACCOUNT = {
  firstName: 'Олег',
  lastName: 'Новик',
  email: 'courier2@example.com',
  phone: '+375334445566',
  password: validRegistration.password,
};

export const CAR = {
  type: VEHICLE_TYPE.CAR,
  brand: 'Skoda',
  model: 'Octavia',
  licensePlate: '1234 AB-7',
};

export const ON_FOOT = { type: VEHICLE_TYPE.FOOT };

export function createCourier(
  app: NestExpressApplication,
  db: Database,
  account = COURIER_ACCOUNT,
): Promise<string> {
  return createUserWithRole(app, db, account, ROLE.COURIER);
}

export async function findCourierProfileId(db: Database, email: string): Promise<number> {
  const [profile] = await db
    .select({ courierProfileId: courierProfiles.courierProfileId })
    .from(courierProfiles)
    .innerJoin(users, eq(users.userId, courierProfiles.userId))
    .where(eq(users.email, email));

  return profile.courierProfileId;
}

// Gives the order to the courier as if they had accepted it.
export async function assignOrder(
  db: Database,
  orderId: number,
  courierProfileId: number,
  status: (typeof orders.$inferSelect)['status'],
): Promise<void> {
  await db
    .update(orders)
    .set({ courierId: courierProfileId, status })
    .where(eq(orders.orderId, orderId));
}

// Puts the courier at a point, past the socket and its rate limit.
export async function placeCourierAt(
  db: Database,
  courierProfileId: number,
  point: GeoPoint,
  at: Date = new Date(),
): Promise<void> {
  await db
    .update(courierProfiles)
    .set({ currentLat: point.latitude, currentLng: point.longitude, locationUpdatedAt: at })
    .where(eq(courierProfiles.courierProfileId, courierProfileId));
}

export function getCourierMe(app: NestExpressApplication, cookies: string) {
  return getApi(app, `${COURIERS_ROUTES.BASE}/${COURIERS_ROUTES.ME}`).set(COOKIE_HEADER, cookies);
}

export function putVehicle(
  app: NestExpressApplication,
  cookies: string,
  body: Record<string, unknown>,
) {
  return putApi(app, `${COURIERS_ROUTES.BASE}/${COURIERS_ROUTES.VEHICLE}`)
    .set(COOKIE_HEADER, cookies)
    .send(body);
}

export function putAvailability(
  app: NestExpressApplication,
  cookies: string,
  body: Record<string, unknown>,
) {
  return putApi(app, `${COURIERS_ROUTES.BASE}/${COURIERS_ROUTES.AVAILABILITY}`)
    .set(COOKIE_HEADER, cookies)
    .send(body);
}
