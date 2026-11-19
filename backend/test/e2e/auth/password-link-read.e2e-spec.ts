import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ROLE } from '@/common/enums/role.enum';
import { TOKEN_KIND } from '@/common/enums/token-kind.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { passwordResetTokens, users } from '@/database/schema';
import { PASSWORD_LINK_INVALID_MESSAGE } from '@/modules/auth/constants/password-links.constants';
import { createTestApp } from '@test/support/app';
import { resetTestData } from '@test/support/database';
import {
  createInvitedStaff,
  expireLinks,
  getPasswordLink,
  INVITED_COURIER,
  type InvitedStaff,
  issueLink,
} from '@test/support/password-links';

const UNKNOWN_TOKEN = 'A'.repeat(43);
const INVALID_BODY = {
  statusCode: HttpStatus.NOT_FOUND,
  message: PASSWORD_LINK_INVALID_MESSAGE,
};

describe('Reading a set password link (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let courier: InvitedStaff;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    courier = await createInvitedStaff(db, ROLE.COURIER);
    token = await issueLink(app, courier.userId, TOKEN_KIND.INVITE);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should give the kind, the first name, the email and the role when the link is valid', async () => {
    const response = await getPasswordLink(app, token).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      kind: TOKEN_KIND.INVITE,
      firstName: INVITED_COURIER.firstName,
      email: INVITED_COURIER.email,
      role: ROLE.COURIER,
    });
  });

  it('should change nothing when the link is read', async () => {
    await getPasswordLink(app, token).expect(HttpStatus.OK);

    const [link] = await db.select().from(passwordResetTokens);

    expect(link.usedAt).toBeNull();
  });

  it.each<[string, () => Promise<string>]>([
    ['unknown', () => Promise.resolve(UNKNOWN_TOKEN)],
    ['malformed', () => Promise.resolve('not-a-token')],
    [
      'used',
      async () => {
        await db.update(passwordResetTokens).set({ usedAt: new Date() });
        return token;
      },
    ],
    [
      'expired',
      async () => {
        await expireLinks(db, courier.userId);
        return token;
      },
    ],
    [
      'of a blocked user',
      async () => {
        await db.update(users).set({ isBlocked: true }).where(eq(users.userId, courier.userId));
        return token;
      },
    ],
    [
      'of a deleted user',
      async () => {
        await db
          .update(users)
          .set({ deletedAt: new Date() })
          .where(eq(users.userId, courier.userId));
        return token;
      },
    ],
  ])('should answer the same 404 when the link is %s', async (_case, prepare) => {
    const response = await getPasswordLink(app, await prepare()).expect(HttpStatus.NOT_FOUND);

    expect(response.body).toMatchObject(INVALID_BODY);
  });
});
