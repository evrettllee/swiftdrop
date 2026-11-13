import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { TOKEN_KIND } from '@/common/enums/token-kind.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orderOffers } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { SOCKET_ERRORS } from '@/modules/realtime/constants/realtime.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId, insertUser } from '@test/support/admin';
import { deleteAdminUser, recordShiftEvents } from '@test/support/admin-access';
import { postStaff, STAFF_COURIER, tokenOf } from '@test/support/admin-staff';
import { addCourierSession, insertOffer } from '@test/support/assignment';
import { registerUser } from '@test/support/auth';
import { CAR, COURIER_ACCOUNT, getCourierMe } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { mailGatewayOf } from '@test/support/mail';
import { getPasswordLink, issueLink } from '@test/support/password-links';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { connectAppSocket, listenTestApp } from '@test/support/sockets';

describe('Admin delete of staff (e2e)', () => {
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
    mailGatewayOf(app).clearSentMails();
    admin = await createAdmin(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should take a courier on shift off the line, expire the offer and close every door', async () => {
    const [orderId] = await placeOrders(app, (await registerUser(app)).cookies, 1);
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const userId = await findUserId(db, COURIER_ACCOUNT.email);
    const offerId = await insertOffer(db, orderId, courier.courierProfileId);
    const token = await issueLink(app, userId, TOKEN_KIND.RESET);
    const events = recordShiftEvents(app);

    const response = await deleteAdminUser(app, admin, userId).expect(HttpStatus.OK);

    expect(response.body).toMatchObject({
      status: 'deleted',
      courier: { isAvailable: false, vehicleType: CAR.type },
      deletion: { at: expect.any(String) },
    });
    const [offer] = await db.select().from(orderOffers).where(eq(orderOffers.offerId, offerId));
    expect(offer.status).toBe(ORDER_OFFER_STATUS.EXPIRED);
    expect(events).toEqual([{ courierProfileId: courier.courierProfileId, isAvailable: false }]);
    await getCourierMe(app, courier.cookies).expect(HttpStatus.UNAUTHORIZED);
    await getPasswordLink(app, token).expect(HttpStatus.NOT_FOUND);
    await expect(connectAppSocket(baseUrl, courier.cookies)).rejects.toThrow(
      SOCKET_ERRORS.UNAUTHORIZED,
    );
  });

  it('should delete an invited courier and invite the same email and phone again', async () => {
    const first = await postStaff(app, admin, STAFF_COURIER).expect(HttpStatus.CREATED);

    const response = await deleteAdminUser(app, admin, first.body.userId).expect(HttpStatus.OK);
    expect(response.body).toMatchObject({ status: 'deleted', invite: null, phone: null });
    await getPasswordLink(app, tokenOf(first.body.setPasswordUrl)).expect(HttpStatus.NOT_FOUND);

    const again = await postStaff(app, admin, STAFF_COURIER).expect(HttpStatus.CREATED);
    expect(again.body.userId).not.toBe(first.body.userId);
  });

  it.each([
    ['a blocked manager', { isBlocked: true }],
    ['an active manager', {}],
  ])('should delete %s', async (_case, seed) => {
    const userId = await insertUser(db, {
      role: ROLE.MANAGER,
      email: 'm@x.by',
      phone: '+375290001122',
      ...seed,
    });

    const response = await deleteAdminUser(app, admin, userId).expect(HttpStatus.OK);

    expect(response.body).toMatchObject({
      role: ROLE.MANAGER,
      status: 'deleted',
      firstName: 'Удалённый пользователь',
      phone: null,
      block: null,
    });
  });
});
