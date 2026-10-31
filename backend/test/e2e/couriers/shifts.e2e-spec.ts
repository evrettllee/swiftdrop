import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { asc, eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierShifts } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import {
  assignOrder,
  CAR,
  createCourier,
  findCourierProfileId,
  COURIER_ACCOUNT,
  putAvailability,
  putVehicle,
} from '@test/support/couriers';
import { placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

describe('Courier shift log (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: string;
  let courierId: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    cookies = await createCourier(app, db);
    await putVehicle(app, cookies, CAR).expect(HttpStatus.OK);
    courierId = await findCourierProfileId(db, COURIER_ACCOUNT.email);
  });

  afterAll(async () => {
    await app.close();
  });

  const shifts = () =>
    db
      .select({ startedAt: courierShifts.startedAt, endedAt: courierShifts.endedAt })
      .from(courierShifts)
      .where(eq(courierShifts.courierId, courierId))
      .orderBy(asc(courierShifts.shiftId));
  const setAvailability = (isAvailable: boolean) =>
    putAvailability(app, cookies, { isAvailable }).expect(HttpStatus.OK);

  it('should open a shift on going on the line and close it on leaving', async () => {
    const before = new Date();
    await setAvailability(true);

    const [opened] = await shifts();
    expect(opened.endedAt).toBeNull();
    expect(opened.startedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);

    await setAvailability(false);

    const [closed] = await shifts();
    expect(closed.startedAt).toEqual(opened.startedAt);
    expect(closed.endedAt?.getTime()).toBeGreaterThanOrEqual(opened.startedAt.getTime());
  });

  it('should keep one open shift when the courier goes on the line twice', async () => {
    await setAvailability(true);
    await setAvailability(true);

    expect(await shifts()).toEqual([{ startedAt: expect.any(Date), endedAt: null }]);
  });

  it('should start a new shift each time the courier comes back', async () => {
    await setAvailability(true);
    await setAvailability(false);
    await setAvailability(true);

    const log = await shifts();
    expect(log).toHaveLength(2);
    expect(log[0].endedAt).not.toBeNull();
    expect(log[1].endedAt).toBeNull();
  });

  it('should keep the shift open when leaving the line is refused for an active order', async () => {
    await setAvailability(true);
    const [orderId] = await placeOrders(app, (await registerUser(app)).cookies, 1);
    await assignOrder(db, orderId, courierId, ORDER_STATUS.PICKED_UP);

    await putAvailability(app, cookies, { isAvailable: false }).expect(HttpStatus.CONFLICT);

    expect(await shifts()).toEqual([{ startedAt: expect.any(Date), endedAt: null }]);
  });

  it('should open no shift when going on the line is refused without a vehicle', async () => {
    const other = await createCourier(app, db, {
      ...COURIER_ACCOUNT,
      email: 'nocar@example.com',
      phone: '+375330001122',
    });

    await putAvailability(app, other, { isAvailable: true }).expect(HttpStatus.CONFLICT);

    expect(await db.select().from(courierShifts)).toEqual([]);
  });
});
