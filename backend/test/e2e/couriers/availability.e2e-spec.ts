import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { courierProfiles } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { createTestApp } from '../../support/app';
import { MINSK_PICKUP } from '../../support/fixtures';
import {
  CAR,
  createCourier,
  getCourierMe,
  putAvailability,
  putVehicle,
} from '../../support/couriers';
import { resetServiceArea } from '../../support/pricing';

describe('Courier availability (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: string;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    cookies = await createCourier(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 409 when the courier goes on shift without a vehicle', async () => {
    await putAvailability(app, cookies, { isAvailable: true }).expect(HttpStatus.CONFLICT);

    const me = await getCourierMe(app, cookies).expect(HttpStatus.OK);
    expect(me.body.isAvailable).toBe(false);
  });

  it('should put the courier on shift when a vehicle is set', async () => {
    await putVehicle(app, cookies, CAR).expect(HttpStatus.OK);

    const response = await putAvailability(app, cookies, { isAvailable: true }).expect(
      HttpStatus.OK,
    );

    expect(response.body).toEqual({ isAvailable: true, vehicle: CAR, activeOrderId: null });
  });

  it('should clear the position when the courier goes off shift', async () => {
    await putVehicle(app, cookies, CAR).expect(HttpStatus.OK);
    await putAvailability(app, cookies, { isAvailable: true }).expect(HttpStatus.OK);
    await db.update(courierProfiles).set({
      currentLat: MINSK_PICKUP.latitude,
      currentLng: MINSK_PICKUP.longitude,
      locationUpdatedAt: new Date(),
    });

    await putAvailability(app, cookies, { isAvailable: false }).expect(HttpStatus.OK);

    const [profile] = await db.select().from(courierProfiles);
    expect(profile).toMatchObject({
      isAvailable: false,
      currentLat: null,
      currentLng: null,
      locationUpdatedAt: null,
    });
  });

  it('should return 400 when the availability is not a boolean', async () => {
    await putAvailability(app, cookies, { isAvailable: 'yes' }).expect(HttpStatus.BAD_REQUEST);
  });

  it('should never leave the courier on shift without a vehicle when both change at once', async () => {
    await Promise.all([
      putVehicle(app, cookies, CAR),
      putAvailability(app, cookies, { isAvailable: true }),
    ]);

    const me = await getCourierMe(app, cookies).expect(HttpStatus.OK);
    expect(me.body.isAvailable === false || me.body.vehicle !== null).toBe(true);
  });
});
