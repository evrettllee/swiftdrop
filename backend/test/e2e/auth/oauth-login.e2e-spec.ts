import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { AUTH_ERROR_MESSAGES } from '@/modules/auth/constants/access.constants';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import { AuthService } from '@/modules/auth/services/auth.service';
import { OAUTH_PROVIDER } from '@/common/enums/oauth-provider.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { users } from '@/database/schema';
import {
  COOKIE_HEADER,
  postAuth,
  refreshCookie,
  registerUser,
  validRegistration,
  buildOAuthProfile,
} from '@test/support/auth';
import { createTestApp } from '@test/support/app';
import { resetTestData } from '@test/support/database';
import { findLinks, findUsers } from '@test/support/users';

describe('OAuth login (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let authService: AuthService;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
    authService = app.get(AuthService);
  });

  beforeEach(async () => {
    await resetTestData(db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function markEmailVerified(email: string): Promise<void> {
    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.email, email));
  }

  it('should create a verified client without a password and link the account when the user is new', async () => {
    const profile = buildOAuthProfile();

    const result = await authService.loginWithOAuth(profile);
    const [user] = await findUsers(db);

    expect(result.user).toMatchObject({ email: profile.email, role: ROLE.CLIENT, phone: null });
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(user.passwordHash).toBeNull();
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(await findLinks(db)).toEqual([
      expect.objectContaining({
        userId: user.userId,
        provider: profile.provider,
        providerUserId: profile.providerUserId,
      }),
    ]);
  });

  it('should return the same user without creating duplicates when the same provider account logs in again', async () => {
    const profile = buildOAuthProfile();

    const first = await authService.loginWithOAuth(profile);
    const second = await authService.loginWithOAuth(profile);

    expect(second.user.userId).toBe(first.user.userId);
    expect(await findUsers(db)).toHaveLength(1);
    expect(await findLinks(db)).toHaveLength(1);
  });

  it('should link a second provider to the same user when the email matches', async () => {
    const google = await authService.loginWithOAuth(buildOAuthProfile());
    const yandex = await authService.loginWithOAuth(
      buildOAuthProfile({ provider: OAUTH_PROVIDER.YANDEX, providerUserId: 'yandex-user-1' }),
    );

    expect(yandex.user.userId).toBe(google.user.userId);
    expect(await findUsers(db)).toHaveLength(1);
    expect(await findLinks(db)).toHaveLength(2);
  });

  it('should drop the password and revoke sessions when an unverified account is claimed through a provider', async () => {
    const { body, refreshToken } = await registerUser(app);

    const result = await authService.loginWithOAuth(buildOAuthProfile());
    const [user] = await findUsers(db);

    expect(result.user.userId).toBe(body.user.userId);
    expect(user.passwordHash).toBeNull();
    expect(user.emailVerifiedAt).not.toBeNull();

    const passwordLogin = await postAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email: validRegistration.email, password: validRegistration.password })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(passwordLogin.body.message).toBe(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    await postAuth(app, AUTH_ROUTES.REFRESH)
      .set(COOKIE_HEADER, refreshCookie(refreshToken))
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should keep the password and sessions when a verified account gets linked', async () => {
    const { body, refreshToken } = await registerUser(app);
    await markEmailVerified(validRegistration.email);

    const result = await authService.loginWithOAuth(buildOAuthProfile());

    expect(result.user.userId).toBe(body.user.userId);
    await postAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email: validRegistration.email, password: validRegistration.password })
      .expect(HttpStatus.OK);
    await postAuth(app, AUTH_ROUTES.REFRESH)
      .set(COOKIE_HEADER, refreshCookie(refreshToken))
      .expect(HttpStatus.OK);
    expect(await findLinks(db)).toHaveLength(1);
  });
});
