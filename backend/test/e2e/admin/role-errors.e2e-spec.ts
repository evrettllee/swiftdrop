import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { VALIDATION_ERROR_MESSAGE } from '@/common/constants/http.constants';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import {
  ADMIN_ROLE_MESSAGES,
  ADMIN_STAFF_MESSAGES,
} from '@/modules/admin/constants/admin-staff.constants';
import { USER_NOT_FOUND_MESSAGE } from '@/modules/admin/constants/admin-users.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId, insertUser } from '@test/support/admin';
import { findActions, postRole } from '@test/support/admin-staff';
import { resetTestData } from '@test/support/database';
import { ADMIN_ACCOUNT } from '@test/support/users';

describe('Admin role change errors (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    admin = await createAdmin(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function expectRefused(
    userId: number,
    body: object,
    status: HttpStatus,
    message: string,
  ): Promise<void> {
    const response = await postRole(app, admin, userId, body).expect(status);

    expect(response.body.message).toBe(message);
    expect(await findActions(db, userId)).toHaveLength(0);
  }

  it('should answer 403 for a client', async () => {
    const userId = await insertUser(db, { role: ROLE.CLIENT, email: 'client@x.by' });

    await expectRefused(
      userId,
      { role: ROLE.COURIER },
      HttpStatus.FORBIDDEN,
      ADMIN_ROLE_MESSAGES.CLIENT_ROLE_LOCKED,
    );
  });

  it.each([ROLE.COURIER, ROLE.MANAGER])(
    'should answer 409 when a %s gets the same role',
    async (role) => {
      const userId = await insertUser(db, { role, email: 'staff@x.by' });

      await expectRefused(userId, { role }, HttpStatus.CONFLICT, ADMIN_ROLE_MESSAGES.SAME_ROLE);
    },
  );

  it('should answer 409 for a deleted courier', async () => {
    const userId = await insertUser(db, {
      role: ROLE.COURIER,
      email: 'gone@x.by',
      deletedAt: new Date(),
    });

    await expectRefused(
      userId,
      { role: ROLE.MANAGER },
      HttpStatus.CONFLICT,
      ADMIN_STAFF_MESSAGES.USER_DELETED,
    );
  });

  it('should change the role of a blocked courier', async () => {
    const userId = await insertUser(db, { role: ROLE.COURIER, email: 'b@x.by', isBlocked: true });

    const response = await postRole(app, admin, userId, { role: ROLE.MANAGER }).expect(
      HttpStatus.OK,
    );

    expect(response.body).toMatchObject({ role: ROLE.MANAGER, status: 'blocked' });
  });

  it('should answer 404 for an admin and for an unknown id', async () => {
    const adminId = await findUserId(db, ADMIN_ACCOUNT.email);

    for (const userId of [adminId, 999_999]) {
      await expectRefused(
        userId,
        { role: ROLE.MANAGER },
        HttpStatus.NOT_FOUND,
        USER_NOT_FOUND_MESSAGE,
      );
    }
  });

  it.each([
    {},
    { role: ROLE.ADMIN },
    { role: ROLE.CLIENT },
    { role: 'boss' },
    { role: ROLE.MANAGER, reason: 'x' },
  ])('should answer 400 with the role message for %o', async (body) => {
    const userId = await insertUser(db, { role: ROLE.COURIER, email: 'c@x.by' });

    const response = await postRole(app, admin, userId, body).expect(HttpStatus.BAD_REQUEST);

    expect(response.body.message).toBe(VALIDATION_ERROR_MESSAGE);
    expect(response.body.errors.map((error: { message: string }) => error.message)).toEqual([
      ADMIN_STAFF_MESSAGES.ROLE_INVALID,
    ]);
    expect(await findActions(db, userId)).toHaveLength(0);
  });
});
