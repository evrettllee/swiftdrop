import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, courierShifts } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ADMIN_ROLE_MESSAGES } from '@/modules/admin/constants/admin-staff.constants';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId } from '@test/support/admin';
import { findActions, loginAs, postRole } from '@test/support/admin-staff';
import { addCourierSession } from '@test/support/assignment';
import { COOKIE_HEADER, postAuth, registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT, getCourierMe } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { getManagerOrders } from '@test/support/manager';
import { placeOrders, readOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT } from '@test/support/users';

describe('Admin role change courier to manager (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let adminId: number;
  let courier: { courierProfileId: number; cookies: string };
  let userId: number;
  let orderIds: number[];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    admin = await createAdmin(app, db);
    adminId = await findUserId(db, ADMIN_ACCOUNT.email);
    orderIds = await placeOrders(app, (await registerUser(app)).cookies, 2);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    userId = await findUserId(db, COURIER_ACCOUNT.email);
  });

  afterAll(async () => {
    await app.close();
  });

  function readProfile() {
    return db.select().from(courierProfiles).where(eq(courierProfiles.userId, userId));
  }

  it('should make the courier a manager, end the shift and the sessions and log it', async () => {
    await assignOrder(db, orderIds[0], courier.courierProfileId, ORDER_STATUS.DELIVERED);

    const response = await postRole(app, admin, userId, { role: ROLE.MANAGER }).expect(
      HttpStatus.OK,
    );

    expect(response.body).toMatchObject({
      userId,
      role: ROLE.MANAGER,
      status: 'active',
      courier: null,
      orders: { total: 0, recent: [] },
      history: [{ action: ADMIN_ACTION.ROLE_CHANGED, details: { from: 'courier', to: 'manager' } }],
    });
    const [profile] = await readProfile();
    expect(profile).toMatchObject({
      isAvailable: false,
      currentLat: null,
      locationUpdatedAt: null,
    });
    const shifts = await db
      .select()
      .from(courierShifts)
      .where(eq(courierShifts.courierId, courier.courierProfileId));
    expect(shifts.every((shift) => shift.endedAt !== null)).toBe(true);
    expect(await findActions(db, userId)).toEqual([
      {
        actorId: adminId,
        action: ADMIN_ACTION.ROLE_CHANGED,
        details: { from: ROLE.COURIER, to: ROLE.MANAGER },
      },
    ]);
  });

  it('should refuse the old refresh token and the old access token on courier routes', async () => {
    await postRole(app, admin, userId, { role: ROLE.MANAGER }).expect(HttpStatus.OK);

    await getCourierMe(app, courier.cookies).expect(HttpStatus.FORBIDDEN);
    await postAuth(app, AUTH_ROUTES.REFRESH)
      .set(COOKIE_HEADER, courier.cookies)
      .expect(HttpStatus.UNAUTHORIZED);

    const manager = await loginAs(app, COURIER_ACCOUNT);
    await getManagerOrders(app, manager).expect(HttpStatus.OK);
    await getCourierMe(app, manager).expect(HttpStatus.FORBIDDEN);
  });

  it('should keep the courier profile and the deliveries after the change', async () => {
    await assignOrder(db, orderIds[0], courier.courierProfileId, ORDER_STATUS.DELIVERED);

    await postRole(app, admin, userId, { role: ROLE.MANAGER }).expect(HttpStatus.OK);

    const [profile] = await readProfile();
    expect(profile.courierProfileId).toBe(courier.courierProfileId);
    expect(await readOrderStatus(db, orderIds[0])).toBe(ORDER_STATUS.DELIVERED);
  });

  it.each([ORDER_STATUS.COURIER_ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.IN_TRANSIT])(
    'should answer 409 and change nothing when the courier has an order %s',
    async (status) => {
      await assignOrder(db, orderIds[0], courier.courierProfileId, status);

      const response = await postRole(app, admin, userId, { role: ROLE.MANAGER }).expect(
        HttpStatus.CONFLICT,
      );

      expect(response.body.message).toBe(ADMIN_ROLE_MESSAGES.ACTIVE_ORDER);
      const [profile] = await readProfile();
      expect(profile.isAvailable).toBe(true);
      expect(await findActions(db, userId)).toHaveLength(0);
      await getCourierMe(app, courier.cookies).expect(HttpStatus.OK);
      await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, courier.cookies)
        .expect(HttpStatus.OK);
    },
  );
});
