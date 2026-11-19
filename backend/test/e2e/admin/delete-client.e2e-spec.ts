import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { userOauthAccounts, users } from '@/database/schema';
import { AUTH_ERROR_MESSAGES } from '@/modules/auth/constants/access.constants';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import { AuthService } from '@/modules/auth/services/auth.service';
import { createTestApp } from '@test/support/app';
import { createAdmin, emailsOf, findUserId, getAdminUsers } from '@test/support/admin';
import {
  agedAccessCookie,
  countPersonalLeftovers,
  deleteAdminUser,
  insertPersonalLeftovers,
} from '@test/support/admin-access';
import { findActions } from '@test/support/admin-staff';
import {
  buildOAuthProfile,
  COOKIE_HEADER,
  postAuth,
  registerUser,
  validRegistration,
} from '@test/support/auth';
import { resetTestData } from '@test/support/database';
import { getOrders } from '@test/support/orders';
import { ADMIN_ACCOUNT } from '@test/support/users';

describe('Admin delete of a client (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let session: string;
  let userId: number;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    admin = await createAdmin(app, db);
    session = (await registerUser(app)).cookies;
    userId = await findUserId(db, validRegistration.email);
    await app.get(AuthService).loginWithOAuth(buildOAuthProfile());
  });

  afterAll(async () => {
    await app.close();
  });

  it('should anonymize the client, drop the sign-in ways and keep the trail', async () => {
    await insertPersonalLeftovers(db, userId);

    const response = await deleteAdminUser(app, admin, userId).expect(HttpStatus.OK);

    expect(response.body).toMatchObject({
      userId,
      role: ROLE.CLIENT,
      status: 'deleted',
      firstName: 'Удалённый пользователь',
      lastName: '',
      email: `deleted-${userId}@swiftdrop.invalid`,
      phone: null,
      login: { password: false, google: false, yandex: false },
      deletion: { by: { firstName: ADMIN_ACCOUNT.firstName, lastName: ADMIN_ACCOUNT.lastName } },
      history: [{ action: ADMIN_ACTION.USER_DELETED, details: {} }],
    });
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    expect(user).toMatchObject({ passwordHash: null, deletedAt: expect.any(Date) });
    expect(
      await db.select().from(userOauthAccounts).where(eq(userOauthAccounts.userId, userId)),
    ).toEqual([]);
    expect(await countPersonalLeftovers(db, userId)).toBe(0);
    expect(await findActions(db, userId)).toHaveLength(1);
  });

  it('should refuse the old sessions and the old password', async () => {
    const aged = await agedAccessCookie(app, userId, ROLE.CLIENT);

    await deleteAdminUser(app, admin, userId).expect(HttpStatus.OK);

    await getOrders(app, session).expect(HttpStatus.UNAUTHORIZED);
    await getOrders(app, aged).expect(HttpStatus.UNAUTHORIZED);
    await postAuth(app, AUTH_ROUTES.REFRESH)
      .set(COOKIE_HEADER, session)
      .expect(HttpStatus.UNAUTHORIZED);
    const login = await postAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email: validRegistration.email, password: validRegistration.password })
      .expect(HttpStatus.UNAUTHORIZED);
    expect(login.body.message).toBe(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
  });

  it('should hide the client from the default list and show it with the deleted status', async () => {
    await deleteAdminUser(app, admin, userId).expect(HttpStatus.OK);

    const shown = await getAdminUsers(app, admin, { role: ROLE.CLIENT });
    const deleted = await getAdminUsers(app, admin, { role: ROLE.CLIENT, status: 'deleted' });

    expect(emailsOf(shown.body)).toEqual([]);
    expect(deleted.body.items).toEqual([
      expect.objectContaining({ userId, status: 'deleted', firstName: 'Удалённый пользователь' }),
    ]);
  });

  it('should let the same email and phone register again', async () => {
    await deleteAdminUser(app, admin, userId).expect(HttpStatus.OK);

    const again = await registerUser(app);

    expect(again.body.user.userId).not.toBe(userId);
    expect(again.body.user).toMatchObject({
      email: validRegistration.email,
      phone: validRegistration.phone,
    });
  });

  it('should create a new client when Google signs in with the email of the deleted one', async () => {
    await deleteAdminUser(app, admin, userId).expect(HttpStatus.OK);

    const oauth = await app.get(AuthService).loginWithOAuth(buildOAuthProfile());

    expect(oauth.user).toMatchObject({ role: ROLE.CLIENT, email: validRegistration.email });
    expect(oauth.user.userId).not.toBe(userId);
  });

  it('should answer 409 when the client is deleted twice', async () => {
    await deleteAdminUser(app, admin, userId).expect(HttpStatus.OK);

    const response = await deleteAdminUser(app, admin, userId).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe('Пользователь уже удалён');
    expect(await findActions(db, userId)).toHaveLength(1);
  });
});
