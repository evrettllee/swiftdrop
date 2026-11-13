import { UnauthorizedException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { users } from '@/database/schema';
import { InvitePendingException } from '@/modules/auth/errors/invite-pending.exception';
import { AuthService } from '@/modules/auth/services/auth.service';
import { buildOAuthProfile } from '@test/support/auth';
import { createTestApp } from '@test/support/app';
import { resetTestData } from '@test/support/database';
import { createInvitedStaff, INVITED_COURIER } from '@test/support/password-links';
import { findLinks, findUsers } from '@test/support/users';

describe('OAuth sign-in of staff and deleted users (e2e)', () => {
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

  it('should refuse an invited courier and create no client and no link when they sign in through a provider', async () => {
    await createInvitedStaff(db, ROLE.COURIER);

    await expect(
      authService.loginWithOAuth(buildOAuthProfile({ email: INVITED_COURIER.email })),
    ).rejects.toBeInstanceOf(InvitePendingException);
    expect(await findUsers(db)).toHaveLength(1);
    expect(await findLinks(db)).toHaveLength(0);
  });

  it('should fail the sign-in without a crash and keep no new client when the provider account is linked to a deleted user', async () => {
    const profile = buildOAuthProfile();
    await authService.loginWithOAuth(profile);
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.email, profile.email));

    await expect(authService.loginWithOAuth(profile)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(await findUsers(db)).toHaveLength(1);
    expect(await findLinks(db)).toHaveLength(1);
  });

  it('should create a new client when the email belongs only to a deleted user and the provider account is new', async () => {
    const profile = buildOAuthProfile();
    await authService.loginWithOAuth(profile);
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.email, profile.email));

    const result = await authService.loginWithOAuth({ ...profile, providerUserId: 'another-id' });

    expect(result.user).toMatchObject({ email: profile.email, role: ROLE.CLIENT });
    expect(await findUsers(db)).toHaveLength(2);
  });
});
