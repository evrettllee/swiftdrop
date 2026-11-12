import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { users } from '@/database/schema';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import { AuthService } from '@/modules/auth/services/auth.service';
import { createTestApp } from '@test/support/app';
import {
  buildOAuthProfile,
  COOKIE_HEADER,
  extractRefreshToken,
  postAuth,
  refreshCookie,
  registerUser,
  validRegistration,
} from '@test/support/auth';
import { resetTestData } from '@test/support/database';

describe('Last login time (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function lastLoginOf(email: string): Promise<Date | null> {
    const [user] = await db
      .select({ lastLoginAt: users.lastLoginAt })
      .from(users)
      .where(eq(users.email, email));

    return user.lastLoginAt;
  }

  function login() {
    return postAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email: validRegistration.email, password: validRegistration.password })
      .expect(HttpStatus.OK);
  }

  it('should leave the last login empty when a user registers', async () => {
    await registerUser(app);

    expect(await lastLoginOf(validRegistration.email)).toBeNull();
  });

  it('should set the last login when a user signs in with a password', async () => {
    await registerUser(app);
    const before = Date.now();

    await login();
    const lastLoginAt = await lastLoginOf(validRegistration.email);

    expect(lastLoginAt).toBeInstanceOf(Date);
    expect(lastLoginAt?.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });

  it('should keep the last login when a session is refreshed', async () => {
    await registerUser(app);
    const refreshToken = extractRefreshToken(await login());
    const signedInAt = await lastLoginOf(validRegistration.email);

    await postAuth(app, AUTH_ROUTES.REFRESH)
      .set(COOKIE_HEADER, refreshCookie(refreshToken))
      .expect(HttpStatus.OK);

    expect(await lastLoginOf(validRegistration.email)).toEqual(signedInAt);
  });

  it('should set the last login when a user signs in through a provider', async () => {
    const profile = buildOAuthProfile();

    await app.get(AuthService).loginWithOAuth(profile);

    expect(await lastLoginOf(profile.email)).toBeInstanceOf(Date);
  });
});
