import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ADMIN_ACCESS_MESSAGES } from '@/modules/admin/constants/admin-access.constants';
import { ADMIN_STAFF_MESSAGES } from '@/modules/admin/constants/admin-staff.constants';
import { USER_NOT_FOUND_MESSAGE } from '@/modules/admin/constants/admin-users.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId, insertUser } from '@test/support/admin';
import { postBlock, postUnblock } from '@test/support/admin-access';
import { findActions, loginAs } from '@test/support/admin-staff';
import { addCourierSession } from '@test/support/assignment';
import { CAR, COURIER_ACCOUNT, getCourierMe } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT } from '@test/support/users';

describe('Admin user unblock (e2e)', () => {
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
    admin = await createAdmin(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should open the sign-in again and keep the courier off shift', async () => {
    await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const userId = await findUserId(db, COURIER_ACCOUNT.email);
    await postBlock(app, admin, userId).expect(HttpStatus.OK);

    const response = await postUnblock(app, admin, userId).expect(HttpStatus.OK);

    expect(response.body).toMatchObject({
      status: 'active',
      block: null,
      courier: { isAvailable: false },
    });
    expect((await findActions(db, userId)).map((row) => row.action)).toEqual([
      ADMIN_ACTION.USER_BLOCKED,
      ADMIN_ACTION.USER_UNBLOCKED,
    ]);
    const me = await getCourierMe(app, await loginAs(app, COURIER_ACCOUNT)).expect(HttpStatus.OK);
    expect(me.body.isAvailable).toBe(false);
  });

  it.each([
    ['an active manager', { role: ROLE.MANAGER }, ADMIN_ACCESS_MESSAGES.NOT_BLOCKED],
    [
      'a deleted blocked client',
      { role: ROLE.CLIENT, isBlocked: true, deletedAt: new Date() },
      ADMIN_STAFF_MESSAGES.USER_DELETED,
    ],
  ])('should answer 409 for %s', async (_case, seed, message) => {
    const userId = await insertUser(db, { email: 'u@x.by', ...seed });

    const response = await postUnblock(app, admin, userId).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(message);
    expect(await findActions(db, userId)).toHaveLength(0);
  });

  it('should answer 404 for an admin', async () => {
    const response = await postUnblock(
      app,
      admin,
      await findUserId(db, ADMIN_ACCOUNT.email),
    ).expect(HttpStatus.NOT_FOUND);

    expect(response.body.message).toBe(USER_NOT_FOUND_MESSAGE);
  });
});
