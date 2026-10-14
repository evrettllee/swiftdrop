import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { GeoPoint } from '../../src/common/schemas/geo-point.schema';
import type { Database } from '../../src/database/database.module';
import { orderOffers } from '../../src/database/schema';
import { OFFER_TTL_MS } from '../../src/modules/assignment/constants/assignment.constants';
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
