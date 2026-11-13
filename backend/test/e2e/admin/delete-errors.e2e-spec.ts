import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { users } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ADMIN_DELETE_MESSAGES } from '@/modules/admin/constants/admin-delete.constants';
import { USER_NOT_FOUND_MESSAGE } from '@/modules/admin/constants/admin-users.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId } from '@test/support/admin';
import { deleteAdminUser } from '@test/support/admin-access';
import { findActions } from '@test/support/admin-staff';
import { addCourierSession } from '@test/support/assignment';
import { registerUser, validRegistration } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT, getCourierMe } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT } from '@test/support/users';

describe('Admin delete refusals (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let orderId: number;
  let client: string;
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

  async function expectUnchanged(userId: number, email: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.userId, userId));

    expect(user).toMatchObject({ email, deletedAt: null });
    expect(await findActions(db, userId)).toHaveLength(0);
  }

  it.each([ORDER_STATUS.COURIER_ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.IN_TRANSIT])(
    'should keep a courier with an order %s',
    async (status) => {
      const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
      await assignOrder(db, orderId, courier.courierProfileId, status);
      const userId = await findUserId(db, COURIER_ACCOUNT.email);

      const response = await deleteAdminUser(app, admin, userId).expect(HttpStatus.CONFLICT);

      expect(response.body.message).toBe(ADMIN_DELETE_MESSAGES.ACTIVE_ORDER);
      await expectUnchanged(userId, COURIER_ACCOUNT.email);
      await getCourierMe(app, courier.cookies).expect(HttpStatus.OK);
    },
  );

  it.each([
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
    ORDER_STATUS.COURIER_ASSIGNED,
    ORDER_STATUS.PICKED_UP,
    ORDER_STATUS.IN_TRANSIT,
  ])('should keep a client with an order %s', async (status) => {
    await setOrderStatus(db, orderId, status);
    const userId = await findUserId(db, validRegistration.email);

    const response = await deleteAdminUser(app, admin, userId).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(ADMIN_DELETE_MESSAGES.ACTIVE_ORDER);
    await expectUnchanged(userId, validRegistration.email);
  });

  it.each([ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED])(
    'should delete a client whose order is %s',
    async (status) => {
      await setOrderStatus(db, orderId, status);

      const response = await deleteAdminUser(
        app,
        admin,
        await findUserId(db, validRegistration.email),
      ).expect(HttpStatus.OK);

      expect(response.body.orders.total).toBe(1);
    },
  );

  it('should answer 404 for an admin and an unknown id', async () => {
    for (const userId of [await findUserId(db, ADMIN_ACCOUNT.email), 999_999]) {
      const response = await deleteAdminUser(app, admin, userId).expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toBe(USER_NOT_FOUND_MESSAGE);
    }
  });
});
