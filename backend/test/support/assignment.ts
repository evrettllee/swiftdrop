import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import type { GeoPoint } from '@/common/schemas/geo-point.schema';
import type { Database } from '@/database/database.module';
import { courierProfiles, orderOffers, orderStatusHistory, roles, users } from '@/database/schema';
import { OFFER_TTL_MS } from '@/modules/assignment/constants/assignment.constants';
import {
  type COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  placeCourierAt,
  putAvailability,
  putVehicle,
} from './couriers';

export const OFFER_ETA = { pickupEtaSec: 300, totalEtaSec: 1200 };

// A courier on shift with the vehicle, standing at the point, and the session of that courier.
export async function addCourierSession(
  app: NestExpressApplication,
  db: Database,
  account: typeof COURIER_ACCOUNT,
  vehicle: Record<string, unknown>,
  point: GeoPoint,
): Promise<{ courierProfileId: number; cookies: string }> {
  const cookies = await createCourier(app, db, account);
  await putVehicle(app, cookies, vehicle).expect(HttpStatus.OK);
  await putAvailability(app, cookies, { isAvailable: true }).expect(HttpStatus.OK);
  const courierProfileId = await findCourierProfileId(db, account.email);
  await placeCourierAt(db, courierProfileId, point);

  return { courierProfileId, cookies };
}

// The same courier when the test needs only the profile id.
export async function addCourierOnShift(
  app: NestExpressApplication,
  db: Database,
  account: typeof COURIER_ACCOUNT,
  vehicle: Record<string, unknown>,
  point: GeoPoint,
): Promise<number> {
  const { courierProfileId } = await addCourierSession(app, db, account, vehicle, point);

  return courierProfileId;
}

// Courier profiles with no session and no vehicle, for tests that only need offers to refer to them.
export async function insertBareCouriers(db: Database, total: number): Promise<number[]> {
  const [courierRole] = await db
    .select({ roleId: roles.roleId })
    .from(roles)
    .where(eq(roles.name, ROLE.COURIER));
  const ids: number[] = [];

  for (let index = 0; index < total; index += 1) {
    const [user] = await db
      .insert(users)
      .values({
        roleId: courierRole.roleId,
        firstName: 'Курьер',
        lastName: 'Тестовый',
        email: `bare-courier-${index}@example.com`,
      })
      .returning({ userId: users.userId });
    const [profile] = await db
      .insert(courierProfiles)
      .values({ userId: user.userId })
      .returning({ courierProfileId: courierProfiles.courierProfileId });
    ids.push(profile.courierProfileId);
  }

  return ids;
}

// An open offer of the order to the courier, the fields can be overridden.
export async function insertOffer(
  db: Database,
  orderId: number,
  courierId: number,
  overrides: Partial<typeof orderOffers.$inferInsert> = {},
): Promise<number> {
  const [offer] = await db
    .insert(orderOffers)
    .values({
      orderId,
      courierId,
      expiresAt: new Date(Date.now() + OFFER_TTL_MS),
      ...OFFER_ETA,
      ...overrides,
    })
    .returning({ offerId: orderOffers.offerId });

  return offer.offerId;
}

// The history row of the payment, as the webhook writes it, at the given moment.
export async function recordConfirmation(db: Database, orderId: number, at: Date): Promise<void> {
  await db
    .insert(orderStatusHistory)
    .values({ orderId, status: ORDER_STATUS.CONFIRMED, changedBy: null, changedAt: at });
}
