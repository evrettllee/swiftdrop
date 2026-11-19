import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ADMIN_ACCESS_MESSAGES } from '@/modules/admin/constants/admin-access.constants';
import { ADMIN_STAFF_MESSAGES } from '@/modules/admin/constants/admin-staff.constants';
import { USER_NOT_FOUND_MESSAGE } from '@/modules/admin/constants/admin-users.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId, insertUser } from '@test/support/admin';
import { postBlock } from '@test/support/admin-access';
import { findActions } from '@test/support/admin-staff';
import { registerUser, validRegistration } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT, getCourierMe } from '@test/support/couriers';
import { addCourierSession } from '@test/support/assignment';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT } from '@test/support/users';

describe('Admin user block refusals (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let orderId: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    admin = await createAdmin(app, db);
    [orderId] = await placeOrders(app, (await registerUser(app)).cookies, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  async function expectRefused(userId: number, status: HttpStatus, message: string, body?: object) {
    const response = await postBlock(app, admin, userId, body).expect(status);

    expect(response.body.message).toBe(message);
    expect(await findActions(db, userId)).toHaveLength(0);
  }

  it.each([ORDER_STATUS.COURIER_ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.IN_TRANSIT])(
    'should keep a courier with an order %s on the job',
    async (status) => {
      const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
      await assignOrder(db, orderId, courier.courierProfileId, status);
      const userId = await findUserId(db, COURIER_ACCOUNT.email);

      await expectRefused(userId, HttpStatus.CONFLICT, ADMIN_ACCESS_MESSAGES.BLOCK_ACTIVE_ORDER);
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
  ])('should refuse a client with an order %s', async (status) => {
    await setOrderStatus(db, orderId, status);

    await expectRefused(
      await findUserId(db, validRegistration.email),
      HttpStatus.CONFLICT,
      ADMIN_ACCESS_MESSAGES.BLOCK_ACTIVE_ORDER,
    );
  });

  it.each([
    ['invited', { passwordHash: null }, ADMIN_ACCESS_MESSAGES.BLOCK_INVITED],
    ['already blocked', { isBlocked: true }, ADMIN_ACCESS_MESSAGES.ALREADY_BLOCKED],
    ['deleted', { deletedAt: new Date() }, ADMIN_STAFF_MESSAGES.USER_DELETED],
  ])('should answer 409 for a %s manager', async (_case, seed, message) => {
    const userId = await insertUser(db, { role: ROLE.MANAGER, email: 'm@x.by', ...seed });

    await expectRefused(userId, HttpStatus.CONFLICT, message);
  });

  it('should answer 404 for an admin and an unknown id', async () => {
    for (const userId of [await findUserId(db, ADMIN_ACCOUNT.email), 999_999]) {
      await expectRefused(userId, HttpStatus.NOT_FOUND, USER_NOT_FOUND_MESSAGE);
    }
  });

  it.each([
    [{}, ADMIN_ACCESS_MESSAGES.REASON_REQUIRED],
    [{ reason: '   ' }, ADMIN_ACCESS_MESSAGES.REASON_REQUIRED],
    [{ reason: 'я'.repeat(501) }, ADMIN_ACCESS_MESSAGES.REASON_TOO_LONG],
  ])('should answer 400 for the body %#', async (body, message) => {
    const userId = await insertUser(db, { role: ROLE.MANAGER, email: 'm@x.by' });

    const response = await postBlock(app, admin, userId, body).expect(HttpStatus.BAD_REQUEST);

    expect(response.body.errors).toEqual([{ field: 'reason', message }]);
  });
});
