import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { AUTH_ERROR_MESSAGES } from '../../src/auth/constants/access';
import { OAUTH_ERROR_MESSAGES } from '../../src/auth/constants/oauth';
import { AUTH_ROUTES } from '../../src/auth/constants/routes';
import { AuthService } from '../../src/auth/auth.service';
import { OAUTH_PROVIDER } from '../../src/common/enums/oauth-provider.enum';
import { ROLE } from '../../src/common/enums/role.enum';
import { DRIZZLE } from '../../src/database/database.constants';
import type { Database } from '../../src/database/database.module';
import { userOauthAccounts, users } from '../../src/db/schema';
import {
  COOKIE_HEADER,
  postAuth,
  refreshCookie,
  registerUser,
  validRegistration,
  buildOAuthProfile,
} from '../support/auth';
import { createTestApp } from '../support/app';
import { resetTestData } from '../support/database';

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

  const findUsers = () => db.select().from(users);
  const findLinks = () => db.select().from(userOauthAccounts);

  async function markEmailVerified(email: string): Promise<void> {
    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.email, email));
  }

  async function blockUser(email: string): Promise<void> {
    await db.update(users).set({ isBlocked: true }).where(eq(users.email, email));
  }

  it('should create a verified client without a password and link the account when the user is new', async () => {
    const profile = buildOAuthProfile();

    const result = await authService.loginWithOAuth(profile);
    const [user] = await findUsers();

    expect(result.user).toMatchObject({ email: profile.email, role: ROLE.CLIENT, phone: null });
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(user.passwordHash).toBeNull();
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(await findLinks()).toEqual([
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
    expect(await findUsers()).toHaveLength(1);
    expect(await findLinks()).toHaveLength(1);
  });

  it('should link a second provider to the same user when the email matches', async () => {
    const google = await authService.loginWithOAuth(buildOAuthProfile());
    const yandex = await authService.loginWithOAuth(
      buildOAuthProfile({ provider: OAUTH_PROVIDER.YANDEX, providerUserId: 'yandex-user-1' }),
    );

    expect(yandex.user.userId).toBe(google.user.userId);
    expect(await findUsers()).toHaveLength(1);
    expect(await findLinks()).toHaveLength(2);
  });

  it('should drop the password and revoke sessions when an unverified account is claimed through a provider', async () => {
    const { body, refreshToken } = await registerUser(app);

    const result = await authService.loginWithOAuth(buildOAuthProfile());
    const [user] = await findUsers();

    expect(result.user.userId).toBe(body.user.userId);
    expect(user.passwordHash).toBeNull();
    expect(user.emailVerifiedAt).not.toBeNull();

    const passwordLogin = await postAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email: validRegistration.email, password: validRegistration.password })
      .expect(401);

    expect(passwordLogin.body.message).toBe(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    await postAuth(app, AUTH_ROUTES.REFRESH)
      .set(COOKIE_HEADER, refreshCookie(refreshToken))
      .expect(401);
  });

  it('should keep the password and sessions when a verified account gets linked', async () => {
    const { body, refreshToken } = await registerUser(app);
    await markEmailVerified(validRegistration.email);

    const result = await authService.loginWithOAuth(buildOAuthProfile());

    expect(result.user.userId).toBe(body.user.userId);
    await postAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email: validRegistration.email, password: validRegistration.password })
      .expect(200);
    await postAuth(app, AUTH_ROUTES.REFRESH)
      .set(COOKIE_HEADER, refreshCookie(refreshToken))
      .expect(200);
    expect(await findLinks()).toHaveLength(1);
  });

  it('should reject the login and create nothing when the provider does not confirm the email', async () => {
    const login = authService.loginWithOAuth(buildOAuthProfile({ emailVerified: false }));

    await expect(login).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(login).rejects.toMatchObject({ message: OAUTH_ERROR_MESSAGES.EMAIL_NOT_VERIFIED });
    expect(await findUsers()).toHaveLength(0);
    expect(await findLinks()).toHaveLength(0);
  });

  it('should reject the login when an existing account with the same email is blocked', async () => {
    await registerUser(app);
    await blockUser(validRegistration.email);

    await expect(authService.loginWithOAuth(buildOAuthProfile())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should reject the login when the user gets blocked after the account was linked', async () => {
    const profile = buildOAuthProfile();
    await authService.loginWithOAuth(profile);
    await blockUser(profile.email);

    await expect(authService.loginWithOAuth(profile)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
