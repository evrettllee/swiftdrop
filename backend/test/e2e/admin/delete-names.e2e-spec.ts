import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { DELETED_USER_FIRST_NAME } from '@/modules/admin/constants/admin-delete.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId } from '@test/support/admin';
import { deleteAdminUser } from '@test/support/admin-access';
import { addCourierSession } from '@test/support/assignment';
import { registerUser, validRegistration } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { createManager, getManagerOrders } from '@test/support/manager';
import { getOrders, placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

describe('Names of deleted users (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let client: string;
  let orderId: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    admin = await createAdmin(app, db);
    client = (await registerUser(app)).cookies;
    [orderId] = await placeOrders(app, client, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should show a deleted client by the placeholder name in the manager orders', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.DELIVERED);
    const manager = await createManager(app, db);
    await deleteAdminUser(app, admin, await findUserId(db, validRegistration.email)).expect(
      HttpStatus.OK,
    );

    const { body } = await getManagerOrders(app, manager).expect(HttpStatus.OK);

    expect(body.items).toEqual([
      expect.objectContaining({
        id: orderId,
        client: { name: DELETED_USER_FIRST_NAME, phone: null },
      }),
    ]);
  });

  it('should show a deleted courier by the placeholder name in the orders of the client', async () => {
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.DELIVERED);
    await deleteAdminUser(app, admin, await findUserId(db, COURIER_ACCOUNT.email)).expect(
      HttpStatus.OK,
    );

    const { body } = await getOrders(app, client).expect(HttpStatus.OK);

    expect(body.items[0].courier).toEqual({ name: DELETED_USER_FIRST_NAME });
  });
});
