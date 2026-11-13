import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { users } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ADMIN_ACCESS_MESSAGES } from '@/modules/admin/constants/admin-access.constants';
import { ADMIN_STAFF_MESSAGES } from '@/modules/admin/constants/admin-staff.constants';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import { SOCKET_ERRORS } from '@/modules/realtime/constants/realtime.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId, insertUser } from '@test/support/admin';
import { agedAccessCookie, postEndSessions, recordShiftEvents } from '@test/support/admin-access';
import { findActions, loginAs } from '@test/support/admin-staff';
import { addCourierSession } from '@test/support/assignment';
import { COOKIE_HEADER, postAuth, registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT, getCourierMe } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { createManager, getManagerOrders } from '@test/support/manager';
import { placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { connectAppSocket, listenTestApp } from '@test/support/sockets';
import { MANAGER_ACCOUNT } from '@test/support/users';

describe('Admin end of user sessions (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let admin: string;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    admin = await createAdmin(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refuse older tokens and the socket and keep the sign-in open', async () => {
    const session = await createManager(app, db);
    const userId = await findUserId(db, MANAGER_ACCOUNT.email);
    const aged = await agedAccessCookie(app, userId, ROLE.MANAGER);

    const response = await postEndSessions(app, admin, userId).expect(HttpStatus.OK);

    expect(response.body.history[0]).toMatchObject({ action: ADMIN_ACTION.SESSIONS_ENDED });
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    expect(user.sessionsValidAfter).toBeInstanceOf(Date);
    await getManagerOrders(app, aged).expect(HttpStatus.UNAUTHORIZED);
    await expect(connectAppSocket(baseUrl, aged)).rejects.toThrow(SOCKET_ERRORS.UNAUTHORIZED);
    await postAuth(app, AUTH_ROUTES.REFRESH)
      .set(COOKIE_HEADER, session)
      .expect(HttpStatus.UNAUTHORIZED);

    const fresh = await loginAs(app, MANAGER_ACCOUNT);
    await getManagerOrders(app, fresh).expect(HttpStatus.OK);
    const socket = await connectAppSocket(baseUrl, fresh);
    socket.close();
  });

  it('should take a courier without an order off shift and tell the map', async () => {
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const events = recordShiftEvents(app);

    const response = await postEndSessions(
      app,
      admin,
      await findUserId(db, COURIER_ACCOUNT.email),
    ).expect(HttpStatus.OK);

    expect(response.body.courier.isAvailable).toBe(false);
    expect(events).toEqual([{ courierProfileId: courier.courierProfileId, isAvailable: false }]);
  });

  it('should keep a courier with an active order on shift and on the order', async () => {
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const [orderId] = await placeOrders(app, (await registerUser(app)).cookies, 1);
    await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.PICKED_UP);
    const userId = await findUserId(db, COURIER_ACCOUNT.email);
    const aged = await agedAccessCookie(app, userId, ROLE.COURIER);
    const events = recordShiftEvents(app);

    await postEndSessions(app, admin, userId).expect(HttpStatus.OK);

    expect(events).toEqual([]);
    await getCourierMe(app, aged).expect(HttpStatus.UNAUTHORIZED);
    const me = await getCourierMe(app, await loginAs(app, COURIER_ACCOUNT)).expect(HttpStatus.OK);
    expect(me.body).toMatchObject({ isAvailable: true, activeOrderId: orderId });
  });

  it.each([
    ['invited', { passwordHash: null }, ADMIN_ACCESS_MESSAGES.SESSIONS_INVITED],
    ['deleted', { deletedAt: new Date() }, ADMIN_STAFF_MESSAGES.USER_DELETED],
  ])('should answer 409 for a %s courier', async (_case, seed, message) => {
    const userId = await insertUser(db, { role: ROLE.COURIER, email: 'c@x.by', ...seed });

    const response = await postEndSessions(app, admin, userId).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(message);
    expect(await findActions(db, userId)).toHaveLength(0);
  });
});
