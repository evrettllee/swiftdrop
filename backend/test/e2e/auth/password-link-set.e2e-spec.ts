import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq, isNull } from 'drizzle-orm';
import { ROLE } from '@/common/enums/role.enum';
import { TOKEN_KIND } from '@/common/enums/token-kind.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { refreshTokens, users } from '@/database/schema';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import { AUTH_VALIDATION_MESSAGES } from '@/modules/auth/constants/validation.constants';
import { createTestApp } from '@test/support/app';
import { findSetCookie, postAuth } from '@test/support/auth';
import { resetTestData } from '@test/support/database';
import {
  createInvitedStaff,
  findLinks,
  INVITED_MANAGER,
  type InvitedStaff,
  issueLink,
  NEW_PASSWORD,
  postPasswordLink,
} from '@test/support/password-links';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '@/modules/auth/constants/tokens.constants';

describe('Setting a password through a link (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: InvitedStaff;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    manager = await createInvitedStaff(db, ROLE.MANAGER);
    token = await issueLink(app, manager.userId, TOKEN_KIND.INVITE);
  });

  afterAll(async () => {
    await app.close();
  });

  async function userRow() {
    const [user] = await db.select().from(users).where(eq(users.userId, manager.userId));

    return user;
  }

  it('should set the password, open a session and allow a login when the link is valid', async () => {
    const response = await postPasswordLink(app, token, NEW_PASSWORD).expect(HttpStatus.OK);
    const user = await userRow();

    expect(response.body).toMatchObject({
      userId: manager.userId,
      email: INVITED_MANAGER.email,
      role: ROLE.MANAGER,
    });
    expect(findSetCookie(response, ACCESS_COOKIE_NAME)).toBeDefined();
    expect(findSetCookie(response, REFRESH_COOKIE_NAME)).toBeDefined();
    expect(user.lastLoginAt).toBeInstanceOf(Date);
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    await postAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email: INVITED_MANAGER.email, password: NEW_PASSWORD })
      .expect(HttpStatus.OK);
  });

  it('should use up every link of the user and refuse the same token again', async () => {
    await postPasswordLink(app, token, NEW_PASSWORD).expect(HttpStatus.OK);

    const links = await findLinks(db, manager.userId);

    expect(links.every((link) => link.usedAt !== null)).toBe(true);
    await postPasswordLink(app, token, NEW_PASSWORD).expect(HttpStatus.NOT_FOUND);
  });

  it('should refuse the older link when a new one is issued', async () => {
    const newer = await issueLink(app, manager.userId, TOKEN_KIND.RESET);

    await postPasswordLink(app, token, NEW_PASSWORD).expect(HttpStatus.NOT_FOUND);
    await postPasswordLink(app, newer, NEW_PASSWORD).expect(HttpStatus.OK);
  });

  it('should revoke the earlier sessions of the user when the password is set', async () => {
    await postPasswordLink(app, token, NEW_PASSWORD).expect(HttpStatus.OK);
    const second = await issueLink(app, manager.userId, TOKEN_KIND.RESET);

    await postPasswordLink(app, second, NEW_PASSWORD).expect(HttpStatus.OK);

    const active = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, manager.userId))
      .then((rows) => rows.filter((row) => row.revokedAt === null));

    expect(active).toHaveLength(1);
  });

  it('should refuse a weak password with the registration messages and keep the link', async () => {
    const response = await postPasswordLink(app, token, 'weak').expect(HttpStatus.BAD_REQUEST);

    expect(JSON.stringify(response.body)).toContain(AUTH_VALIDATION_MESSAGES.PASSWORD_TOO_SHORT);
    expect(await db.select().from(users).where(isNull(users.passwordHash))).toHaveLength(1);
    await postPasswordLink(app, token, NEW_PASSWORD).expect(HttpStatus.OK);
  });
});
