import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { COURIERS_ERROR_MESSAGES } from '../../../src/modules/couriers/constants/couriers.constants';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { assignCourier, placeConfirmedOrder } from '../../support/chat';
import { putAvailability } from '../../support/couriers';
import { setOrderStatus } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';
import { readCourierProfile } from '../../support/tracking';

describe('Courier availability with an active order (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let courier: { cookies: string; courierProfileId: number };
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const { cookies } = await registerUser(app);
    orderId = await placeConfirmedOrder(app, db, cookies);
    courier = await assignCourier(app, db, orderId);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refuse going off shift with 409 when the courier has an active order', async () => {
    const response = await putAvailability(app, courier.cookies, { isAvailable: false }).expect(
      HttpStatus.CONFLICT,
    );

    const profile = await readCourierProfile(db, courier.courierProfileId);
    expect(response.body.message).toBe(COURIERS_ERROR_MESSAGES.ACTIVE_ORDER);
    expect(profile.isAvailable).toBe(true);
    expect(profile.currentLat).not.toBeNull();
  });

  it('should allow going off shift after delivery', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.DELIVERED);

    await putAvailability(app, courier.cookies, { isAvailable: false }).expect(HttpStatus.OK);

    const profile = await readCourierProfile(db, courier.courierProfileId);
    expect(profile).toMatchObject({
      isAvailable: false,
      currentLat: null,
      locationUpdatedAt: null,
    });
  });
});
