import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { GeoPoint } from '../../src/common/schemas/geo-point.schema';
import type { Database } from '../../src/database/database.module';
import {
  type COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  placeCourierAt,
  putAvailability,
  putVehicle,
} from './couriers';

// A courier on shift with the vehicle, standing at the point; returns the courier profile id.
export async function addCourierOnShift(
  app: NestExpressApplication,
  db: Database,
  account: typeof COURIER_ACCOUNT,
  vehicle: Record<string, unknown>,
  point: GeoPoint,
): Promise<number> {
  const cookies = await createCourier(app, db, account);
  await putVehicle(app, cookies, vehicle).expect(HttpStatus.OK);
  await putAvailability(app, cookies, { isAvailable: true }).expect(HttpStatus.OK);
  const courierProfileId = await findCourierProfileId(db, account.email);
  await placeCourierAt(db, courierProfileId, point);

  return courierProfileId;
}
