import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { courierProfiles } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import {
  assignOrder,
  COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  getCourierMe,
} from '../../support/couriers';
import { placeOrders } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';

describe('Courier profile (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create an empty profile when the courier opens the cabinet for the first time', async () => {
    const cookies = await createCourier(app, db);

    const response = await getCourierMe(app, cookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({ isAvailable: false, vehicle: null, activeOrderId: null });
    expect(await db.select().from(courierProfiles)).toHaveLength(1);
  });

  it('should keep one profile when the cabinet is opened twice at once', async () => {
    const cookies = await createCourier(app, db);

    await Promise.all([
      getCourierMe(app, cookies).expect(HttpStatus.OK),
      getCourierMe(app, cookies).expect(HttpStatus.OK),
    ]);

    expect(await db.select().from(courierProfiles)).toHaveLength(1);
  });

  it('should return the active order when the courier carries one', async () => {
    const courierCookies = await createCourier(app, db);
    await getCourierMe(app, courierCookies).expect(HttpStatus.OK);
    const courierProfileId = await findCourierProfileId(db, COURIER_ACCOUNT.email);
    const { cookies: clientCookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, clientCookies, 1);
    await assignOrder(db, orderId, courierProfileId, ORDER_STATUS.PICKED_UP);

    const response = await getCourierMe(app, courierCookies).expect(HttpStatus.OK);

    expect(response.body.activeOrderId).toBe(orderId);
  });

  it('should return 403 when a client opens the courier cabinet', async () => {
    const { cookies } = await registerUser(app);

    await getCourierMe(app, cookies).expect(HttpStatus.FORBIDDEN);
  });
});
