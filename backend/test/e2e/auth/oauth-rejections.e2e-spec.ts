import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { OAUTH_ERROR_MESSAGES } from '@/modules/auth/constants/oauth.constants';
import { AuthService } from '@/modules/auth/services/auth.service';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { registerUser, validRegistration, buildOAuthProfile } from '@test/support/auth';
import { createTestApp } from '@test/support/app';
import { resetTestData } from '@test/support/database';
import { blockUser, findLinks, findUsers } from '@test/support/users';

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

  it('should reject the login and create nothing when the provider does not confirm the email', async () => {
    const login = authService.loginWithOAuth(buildOAuthProfile({ emailVerified: false }));

    await expect(login).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(login).rejects.toMatchObject({ message: OAUTH_ERROR_MESSAGES.EMAIL_NOT_VERIFIED });
    expect(await findUsers(db)).toHaveLength(0);
    expect(await findLinks(db)).toHaveLength(0);
  });

  it('should reject the login when an existing account with the same email is blocked', async () => {
    await registerUser(app);
    await blockUser(db, validRegistration.email);

    await expect(authService.loginWithOAuth(buildOAuthProfile())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should reject the login when the user gets blocked after the account was linked', async () => {
    const profile = buildOAuthProfile();
    await authService.loginWithOAuth(profile);
    await blockUser(db, profile.email);

    await expect(authService.loginWithOAuth(profile)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
