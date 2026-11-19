import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId } from '@test/support/admin';
import { agedAccessCookie } from '@test/support/admin-access';
import {
  findActions,
  loginAs,
  postRole,
  postStaff,
  STAFF_COURIER,
  tokenOf,
} from '@test/support/admin-staff';
import { addCourierSession } from '@test/support/assignment';
import { CAR, COURIER_ACCOUNT, getCourierMe } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { mailGatewayOf } from '@test/support/mail';
import { createManager, getManagerOrders } from '@test/support/manager';
import { NEW_PASSWORD, postPasswordLink } from '@test/support/password-links';
import { resetServiceArea } from '@test/support/pricing';
import { MANAGER_ACCOUNT } from '@test/support/users';

describe('Admin role change to courier and of invited staff (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    mailGatewayOf(app).clearSentMails();
    admin = await createAdmin(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  function profilesOf(userId: number) {
    return db.select().from(courierProfiles).where(eq(courierProfiles.userId, userId));
  }

  it('should keep the old profile off shift when a former courier becomes a courier again', async () => {
    const { courierProfileId } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    );
    const userId = await findUserId(db, COURIER_ACCOUNT.email);
    await postRole(app, admin, userId, { role: ROLE.MANAGER }).expect(HttpStatus.OK);

    const response = await postRole(app, admin, userId, { role: ROLE.COURIER }).expect(
      HttpStatus.OK,
    );

    expect(response.body).toMatchObject({
      role: ROLE.COURIER,
      courier: { vehicleType: CAR.type, isAvailable: false, activeOrderId: null },
    });
    expect(await profilesOf(userId)).toEqual([
      expect.objectContaining({ courierProfileId, isAvailable: false }),
    ]);
    expect((await findActions(db, userId)).map((row) => row.details)).toEqual([
      { from: ROLE.COURIER, to: ROLE.MANAGER },
      { from: ROLE.MANAGER, to: ROLE.COURIER },
    ]);

    const courier = await loginAs(app, COURIER_ACCOUNT);
    const me = await getCourierMe(app, courier).expect(HttpStatus.OK);
    expect(me.body.isAvailable).toBe(false);
  });

  it('should leave a manager without a profile until the first courier visit', async () => {
    await createManager(app, db);
    const userId = await findUserId(db, MANAGER_ACCOUNT.email);
    const aged = await agedAccessCookie(app, userId, ROLE.MANAGER);

    const response = await postRole(app, admin, userId, { role: ROLE.COURIER }).expect(
      HttpStatus.OK,
    );

    expect(response.body.courier).toEqual({
      vehicleType: null,
      deliveredCount: 0,
      cancelledCount: 0,
      isAvailable: false,
      activeOrderId: null,
    });
    expect(await profilesOf(userId)).toHaveLength(0);
    await getManagerOrders(app, aged).expect(HttpStatus.UNAUTHORIZED);

    const courier = await loginAs(app, MANAGER_ACCOUNT);
    await getCourierMe(app, courier).expect(HttpStatus.OK);
    expect(await profilesOf(userId)).toEqual([expect.objectContaining({ isAvailable: false })]);
  });

  it('should keep the invite link of an invited courier who becomes a manager', async () => {
    const invited = await postStaff(app, admin, STAFF_COURIER).expect(HttpStatus.CREATED);
    const { userId, setPasswordUrl } = invited.body;

    const response = await postRole(app, admin, userId, { role: ROLE.MANAGER }).expect(
      HttpStatus.OK,
    );
    expect(response.body).toMatchObject({ role: ROLE.MANAGER, status: 'invited' });
    expect(response.body.invite).toMatchObject({ expiresAt: invited.body.expiresAt });

    const set = await postPasswordLink(app, tokenOf(setPasswordUrl), NEW_PASSWORD).expect(
      HttpStatus.OK,
    );
    expect(set.body.role).toBe(ROLE.MANAGER);

    const manager = await loginAs(app, { email: STAFF_COURIER.email, password: NEW_PASSWORD });
    await getManagerOrders(app, manager).expect(HttpStatus.OK);
  });
});
