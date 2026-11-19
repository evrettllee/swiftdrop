import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { ADMIN_STAFF_MESSAGES } from '@/modules/admin/constants/admin-staff.constants';
import { USER_NOT_FOUND_MESSAGE } from '@/modules/admin/constants/admin-users.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId, insertUser } from '@test/support/admin';
import {
  findActions,
  postResend,
  postStaff,
  STAFF_COURIER,
  type StaffInviteBody,
  tokenOf,
} from '@test/support/admin-staff';
import { resetTestData } from '@test/support/database';
import { mailGatewayOf } from '@test/support/mail';
import {
  findLinks,
  getPasswordLink,
  NEW_PASSWORD,
  postPasswordLink,
} from '@test/support/password-links';
import { ADMIN_ACCOUNT } from '@test/support/users';

describe('Admin staff invite resend (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    mailGatewayOf(app).clearSentMails();
    admin = await createAdmin(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function invite(): Promise<StaffInviteBody> {
    const response = await postStaff(app, admin, STAFF_COURIER).expect(HttpStatus.CREATED);

    return response.body;
  }

  it('should stop the old link and send a working new one', async () => {
    const first = await invite();

    const response = await postResend(app, admin, first.userId).expect(HttpStatus.CREATED);
    const second = response.body as StaffInviteBody;

    expect(second).toMatchObject({
      userId: first.userId,
      email: STAFF_COURIER.email,
      emailSent: true,
    });
    expect(second.setPasswordUrl).not.toBe(first.setPasswordUrl);
    expect(mailGatewayOf(app).lastMailTo(STAFF_COURIER.email)?.text).toContain(
      second.setPasswordUrl,
    );

    const links = await findLinks(db, first.userId);
    expect(links.filter((link) => link.usedAt === null)).toHaveLength(1);

    await getPasswordLink(app, tokenOf(first.setPasswordUrl)).expect(HttpStatus.NOT_FOUND);
    await postPasswordLink(app, tokenOf(first.setPasswordUrl), NEW_PASSWORD).expect(
      HttpStatus.NOT_FOUND,
    );
    await postPasswordLink(app, tokenOf(second.setPasswordUrl), NEW_PASSWORD).expect(HttpStatus.OK);

    expect((await findActions(db, first.userId)).map((row) => row.action)).toEqual([
      ADMIN_ACTION.STAFF_INVITED,
      ADMIN_ACTION.INVITE_RESENT,
    ]);
  });

  it('should give emailSent false and keep the new link when the letter is not sent', async () => {
    const first = await invite();
    mailGatewayOf(app).failNextSend();

    const { body } = await postResend(app, admin, first.userId).expect(HttpStatus.CREATED);

    expect(body.emailSent).toBe(false);
    await getPasswordLink(app, tokenOf(body.setPasswordUrl)).expect(HttpStatus.OK);
  });

  it('should answer 409 when the staff member has already set a password', async () => {
    const first = await invite();
    await postPasswordLink(app, tokenOf(first.setPasswordUrl), NEW_PASSWORD).expect(HttpStatus.OK);

    const response = await postResend(app, admin, first.userId).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(ADMIN_STAFF_MESSAGES.INVITE_ONLY_INVITED);
    expect(await findActions(db, first.userId)).toHaveLength(1);
  });

  it.each([
    ['a client', { role: ROLE.CLIENT, email: 'client@x.by' }],
    [
      'a blocked invited courier',
      { role: ROLE.COURIER, email: 'c@x.by', passwordHash: null, isBlocked: true },
    ],
    [
      'a deleted invited manager',
      { role: ROLE.MANAGER, email: 'm@x.by', passwordHash: null, deletedAt: new Date() },
    ],
  ])('should answer 409 for %s', async (_case, seed) => {
    const userId = await insertUser(db, seed);

    const response = await postResend(app, admin, userId).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(ADMIN_STAFF_MESSAGES.INVITE_ONLY_INVITED);
    expect(await findLinks(db, userId)).toHaveLength(0);
  });

  it('should answer 404 when the target is an admin or unknown', async () => {
    for (const userId of [await findUserId(db, ADMIN_ACCOUNT.email), 999_999]) {
      const response = await postResend(app, admin, userId).expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toBe(USER_NOT_FOUND_MESSAGE);
    }
  });
});
