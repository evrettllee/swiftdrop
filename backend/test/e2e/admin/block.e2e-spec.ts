import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { TOKEN_KIND } from '@/common/enums/token-kind.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, orderOffers } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { AUTH_ERROR_MESSAGES } from '@/modules/auth/constants/access.constants';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import { SOCKET_ERRORS } from '@/modules/realtime/constants/realtime.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId } from '@test/support/admin';
import { agedAccessCookie, postBlock, recordShiftEvents } from '@test/support/admin-access';
import { findActions } from '@test/support/admin-staff';
import { addCourierSession, insertOffer } from '@test/support/assignment';
import { COOKIE_HEADER, postAuth, registerUser, validRegistration } from '@test/support/auth';
import { CAR, COURIER_ACCOUNT, getCourierMe } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { findLinks, getPasswordLink, issueLink } from '@test/support/password-links';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { connectAppSocket, listenTestApp } from '@test/support/sockets';
import { ADMIN_ACCOUNT } from '@test/support/users';

const REASON = 'Жалобы клиентов';

describe('Admin user block (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let admin: string;
  let courier: { courierProfileId: number; cookies: string };
  let userId: number;
  let orderId: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    admin = await createAdmin(app, db);
    [orderId] = await placeOrders(app, (await registerUser(app)).cookies, 1);
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    userId = await findUserId(db, COURIER_ACCOUNT.email);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should block the courier, end the shift, expire the offer and tell the map', async () => {
    const offerId = await insertOffer(db, orderId, courier.courierProfileId);
    const events = recordShiftEvents(app);

    const response = await postBlock(app, admin, userId, { reason: `  ${REASON} ` }).expect(
      HttpStatus.OK,
    );

    expect(response.body).toMatchObject({
      status: 'blocked',
      block: {
        reason: REASON,
        by: { firstName: ADMIN_ACCOUNT.firstName, lastName: ADMIN_ACCOUNT.lastName },
      },
      courier: { isAvailable: false },
    });
    const [offer] = await db.select().from(orderOffers).where(eq(orderOffers.offerId, offerId));
    expect(offer.status).toBe(ORDER_OFFER_STATUS.EXPIRED);
    expect(events).toEqual([{ courierProfileId: courier.courierProfileId, isAvailable: false }]);
    const [profile] = await db
      .select()
      .from(courierProfiles)
      .where(eq(courierProfiles.userId, userId));
    expect(profile.isAvailable).toBe(false);
    expect(await findActions(db, userId)).toEqual([
      expect.objectContaining({ action: ADMIN_ACTION.USER_BLOCKED, details: { reason: REASON } }),
    ]);
  });

  it('should refuse the login, the old tokens and the socket of a blocked user', async () => {
    const aged = await agedAccessCookie(app, userId, ROLE.COURIER);

    await postBlock(app, admin, userId).expect(HttpStatus.OK);

    const login = await postAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email: COURIER_ACCOUNT.email, password: COURIER_ACCOUNT.password })
      .expect(HttpStatus.FORBIDDEN);
    expect(login.body.message).toBe(AUTH_ERROR_MESSAGES.ACCOUNT_BLOCKED);
    await getCourierMe(app, courier.cookies).expect(HttpStatus.UNAUTHORIZED);
    await getCourierMe(app, aged).expect(HttpStatus.UNAUTHORIZED);
    await postAuth(app, AUTH_ROUTES.REFRESH)
      .set(COOKIE_HEADER, courier.cookies)
      .expect(HttpStatus.UNAUTHORIZED);
    await expect(connectAppSocket(baseUrl, courier.cookies)).rejects.toThrow(
      SOCKET_ERRORS.UNAUTHORIZED,
    );
  });

  it('should spend the unused set-password link of the user', async () => {
    const token = await issueLink(app, userId, TOKEN_KIND.RESET);

    await postBlock(app, admin, userId).expect(HttpStatus.OK);

    await getPasswordLink(app, token).expect(HttpStatus.NOT_FOUND);
    expect((await findLinks(db, userId)).every((link) => link.usedAt !== null)).toBe(true);
  });

  it('should block a client whose orders are all finished', async () => {
    const client = await findUserId(db, validRegistration.email);
    await setOrderStatus(db, orderId, ORDER_STATUS.DELIVERED);

    const response = await postBlock(app, admin, client).expect(HttpStatus.OK);

    expect(response.body).toMatchObject({ role: ROLE.CLIENT, status: 'blocked' });
  });
});
