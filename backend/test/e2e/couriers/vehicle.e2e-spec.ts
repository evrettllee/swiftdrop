import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { VEHICLE_TYPE } from '@/common/enums/vehicle-type.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, vehicles } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import {
  assignOrder,
  CAR,
  COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  getCourierMe,
  putVehicle,
} from '@test/support/couriers';
import { placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

describe('Courier vehicle (e2e)', () => {
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

  it('should save the car and show it in the profile when brand, model and plate are given', async () => {
    const response = await putVehicle(app, cookies, CAR).expect(HttpStatus.OK);
    const me = await getCourierMe(app, cookies).expect(HttpStatus.OK);

    expect(response.body).toEqual(CAR);
    expect(me.body.vehicle).toEqual(CAR);
  });

  it('should keep the plate in upper case when it is typed in lower case', async () => {
    const response = await putVehicle(app, cookies, { ...CAR, licensePlate: '1234 ab-7' });

    expect(response.body.licensePlate).toBe(CAR.licensePlate);
  });

  it('should return 400 for the plate when a car comes without it', async () => {
    const { licensePlate: _omitted, ...withoutPlate } = CAR;

    const response = await putVehicle(app, cookies, withoutPlate).expect(HttpStatus.BAD_REQUEST);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'licensePlate' })]),
    );
  });

  it('should drop brand, model and plate when the vehicle is a bicycle', async () => {
    const response = await putVehicle(app, cookies, { ...CAR, type: VEHICLE_TYPE.BICYCLE });

    expect(response.body).toEqual({
      type: VEHICLE_TYPE.BICYCLE,
      brand: null,
      model: null,
      licensePlate: null,
    });
  });

  it('should return 409 when the courier is on shift', async () => {
    await getCourierMe(app, cookies).expect(HttpStatus.OK);
    await db.update(courierProfiles).set({ isAvailable: true });

    await putVehicle(app, cookies, CAR).expect(HttpStatus.CONFLICT);
  });

  it('should return 409 when the courier carries an order', async () => {
    await getCourierMe(app, cookies).expect(HttpStatus.OK);
    const courierProfileId = await findCourierProfileId(db, COURIER_ACCOUNT.email);
    const { cookies: clientCookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, clientCookies, 1);
    await assignOrder(db, orderId, courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);

    await putVehicle(app, cookies, CAR).expect(HttpStatus.CONFLICT);
  });

  it('should keep one vehicle when two changes come at once', async () => {
    await Promise.all([
      putVehicle(app, cookies, CAR).expect(HttpStatus.OK),
      putVehicle(app, cookies, { type: VEHICLE_TYPE.FOOT }).expect(HttpStatus.OK),
    ]);

    expect(await db.select().from(vehicles)).toHaveLength(1);
  });

  it('should return 403 when a client changes a vehicle', async () => {
    const { cookies: clientCookies } = await registerUser(app);

    await putVehicle(app, clientCookies, CAR).expect(HttpStatus.FORBIDDEN);
  });
});
