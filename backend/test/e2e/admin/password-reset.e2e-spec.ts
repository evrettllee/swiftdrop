import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { TOKEN_KIND } from '@/common/enums/token-kind.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ADMIN_ACCESS_MESSAGES } from '@/modules/admin/constants/admin-access.constants';
import { ADMIN_STAFF_MESSAGES } from '@/modules/admin/constants/admin-staff.constants';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId, insertUser } from '@test/support/admin';
import { postPasswordReset, recordShiftEvents } from '@test/support/admin-access';
import { findActions, loginAs, type StaffInviteBody, tokenOf } from '@test/support/admin-staff';
import { addCourierSession } from '@test/support/assignment';
import { postAuth, registerUser, validRegistration } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { mailGatewayOf } from '@test/support/mail';
import { createManager, getManagerOrders } from '@test/support/manager';
import { findLinks, NEW_PASSWORD, postPasswordLink } from '@test/support/password-links';
import { placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT, MANAGER_ACCOUNT } from '@test/support/users';

describe('Admin staff password reset (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let adminId: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    mailGatewayOf(app).clearSentMails();
    admin = await createAdmin(app, db);
    adminId = await findUserId(db, ADMIN_ACCOUNT.email);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should drop the password, send the link and let the manager set a new one', async () => {
    await createManager(app, db);
    const userId = await findUserId(db, MANAGER_ACCOUNT.email);

    const response = await postPasswordReset(app, admin, userId).expect(HttpStatus.OK);
    const body = response.body as StaffInviteBody;

    expect(body).toMatchObject({ userId, email: MANAGER_ACCOUNT.email, emailSent: true });
    const mail = mailGatewayOf(app).lastMailTo(MANAGER_ACCOUNT.email);
    expect(mail?.subject).toBe('Новый пароль для SwiftDrop');
    expect(mail?.text).toContain(body.setPasswordUrl);
    expect(await findLinks(db, userId)).toEqual([
      expect.objectContaining({ kind: TOKEN_KIND.RESET, createdBy: adminId, usedAt: null }),
    ]);
    expect(await findActions(db, userId)).toEqual([
      { actorId: adminId, action: ADMIN_ACTION.PASSWORD_RESET, details: {} },
    ]);

    await postAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email: MANAGER_ACCOUNT.email, password: MANAGER_ACCOUNT.password })
      .expect(HttpStatus.UNAUTHORIZED);
    await postPasswordLink(app, tokenOf(body.setPasswordUrl), NEW_PASSWORD).expect(HttpStatus.OK);
    const fresh = await loginAs(app, { email: MANAGER_ACCOUNT.email, password: NEW_PASSWORD });
    await getManagerOrders(app, fresh).expect(HttpStatus.OK);
  });

  it('should take the courier off shift and give emailSent false when the letter fails', async () => {
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const events = recordShiftEvents(app);
    mailGatewayOf(app).failNextSend();

    const response = await postPasswordReset(
      app,
      admin,
      await findUserId(db, COURIER_ACCOUNT.email),
    ).expect(HttpStatus.OK);

    expect(response.body.emailSent).toBe(false);
    expect(events).toEqual([{ courierProfileId: courier.courierProfileId, isAvailable: false }]);
    await postPasswordLink(app, tokenOf(response.body.setPasswordUrl), NEW_PASSWORD).expect(
      HttpStatus.OK,
    );
  });

  it('should answer 403 for a client', async () => {
    await registerUser(app);

    const response = await postPasswordReset(
      app,
      admin,
      await findUserId(db, validRegistration.email),
    ).expect(HttpStatus.FORBIDDEN);

    expect(response.body.message).toBe(ADMIN_ACCESS_MESSAGES.RESET_CLIENT);
  });

  it.each([
    ['invited', { passwordHash: null }, ADMIN_ACCESS_MESSAGES.RESET_INVITED],
    ['blocked', { isBlocked: true }, ADMIN_ACCESS_MESSAGES.RESET_BLOCKED],
    ['deleted', { deletedAt: new Date() }, ADMIN_STAFF_MESSAGES.USER_DELETED],
  ])('should answer 409 for a %s manager', async (_case, seed, message) => {
    const userId = await insertUser(db, { role: ROLE.MANAGER, email: 'm@x.by', ...seed });

    const response = await postPasswordReset(app, admin, userId).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(message);
    expect(await findLinks(db, userId)).toHaveLength(0);
  });

  it('should answer 409 for a courier with an active order', async () => {
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const [orderId] = await placeOrders(app, (await registerUser(app)).cookies, 1);
    await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.IN_TRANSIT);
    const userId = await findUserId(db, COURIER_ACCOUNT.email);

    const response = await postPasswordReset(app, admin, userId).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(ADMIN_ACCESS_MESSAGES.RESET_ACTIVE_ORDER);
    expect(mailGatewayOf(app).sentMails).toHaveLength(0);
    await loginAs(app, COURIER_ACCOUNT);
  });
});
