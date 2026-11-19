import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ROLE } from '@/common/enums/role.enum';
import { TOKEN_KIND } from '@/common/enums/token-kind.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { users } from '@/database/schema';
import { createTestApp } from '@test/support/app';
import {
  createAdmin,
  emailsOf,
  findUserId,
  getAdminUser,
  getAdminUsers,
} from '@test/support/admin';
import {
  findActions,
  postStaff,
  STAFF_COURIER,
  STAFF_MANAGER,
  type StaffInviteBody,
  tokenOf,
} from '@test/support/admin-staff';
import { resetTestData } from '@test/support/database';
import { mailGatewayOf } from '@test/support/mail';
import { findLinks, NEW_PASSWORD, postPasswordLink } from '@test/support/password-links';
import { ADMIN_ACCOUNT } from '@test/support/users';

const SET_PASSWORD_URL = /^https?:\/\/[^/]+\/set-password\/[A-Za-z0-9_-]{43}$/;
const LINK_TTL_MS = 72 * 60 * 60 * 1000;
const TTL_TOLERANCE_MS = 60_000;

describe('Admin staff invite (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let adminId: number;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    mailGatewayOf(app).clearSentMails();
    admin = await createAdmin(app, db);
    adminId = await findUserId(db, ADMIN_ACCOUNT.email);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([STAFF_COURIER, STAFF_MANAGER])(
    'should create an invited $role with a link, a log row and a letter',
    async (staff) => {
      const response = await postStaff(app, admin, staff).expect(HttpStatus.CREATED);
      const body = response.body as StaffInviteBody;

      expect(Object.keys(body).toSorted()).toEqual(
        ['email', 'emailSent', 'expiresAt', 'setPasswordUrl', 'userId'].toSorted(),
      );
      expect(body).toMatchObject({ email: staff.email, emailSent: true });
      expect(body.setPasswordUrl).toMatch(SET_PASSWORD_URL);
      expect(Math.abs(Date.parse(body.expiresAt) - Date.now() - LINK_TTL_MS)).toBeLessThan(
        TTL_TOLERANCE_MS,
      );
      expect(JSON.stringify(body)).not.toMatch(/tokenHash|passwordHash/);

      const [user] = await db.select().from(users).where(eq(users.userId, body.userId));
      expect(user).toMatchObject({
        firstName: staff.firstName,
        lastName: staff.lastName,
        phone: staff.phone,
        passwordHash: null,
        lastLoginAt: null,
      });

      const [link] = await findLinks(db, body.userId);
      expect(link).toMatchObject({ kind: TOKEN_KIND.INVITE, createdBy: adminId, usedAt: null });
      expect(link.tokenHash).not.toBe(tokenOf(body.setPasswordUrl));

      expect(await findActions(db, body.userId)).toEqual([
        { actorId: adminId, action: ADMIN_ACTION.STAFF_INVITED, details: { role: staff.role } },
      ]);

      const mail = mailGatewayOf(app).lastMailTo(staff.email);
      expect(mail?.subject).toBe('Приглашение в SwiftDrop');
      expect(mail?.text).toContain(body.setPasswordUrl);
      expect(mail?.text).toContain(`Здравствуйте, ${staff.firstName}!`);

      const list = await getAdminUsers(app, admin, { role: staff.role }).expect(HttpStatus.OK);
      expect(list.body.items).toEqual([
        expect.objectContaining({ userId: body.userId, status: 'invited' }),
      ]);
    },
  );

  it('should open the card of an invited courier with the invite and history', async () => {
    const { body } = await postStaff(app, admin, STAFF_COURIER).expect(HttpStatus.CREATED);

    const card = await getAdminUser(app, admin, body.userId).expect(HttpStatus.OK);

    expect(card.body).toMatchObject({
      role: ROLE.COURIER,
      status: 'invited',
      invite: { expiresAt: body.expiresAt },
      courier: { vehicleType: null, deliveredCount: 0, activeOrderId: null },
      history: [
        {
          action: ADMIN_ACTION.STAFF_INVITED,
          actor: { firstName: ADMIN_ACCOUNT.firstName, lastName: ADMIN_ACCOUNT.lastName },
          details: { role: ROLE.COURIER },
        },
      ],
    });
  });

  it('should keep the user and the link when the letter is not sent', async () => {
    mailGatewayOf(app).failNextSend();

    const { body } = await postStaff(app, admin, STAFF_MANAGER).expect(HttpStatus.CREATED);

    expect(body.emailSent).toBe(false);
    expect(body.setPasswordUrl).toMatch(SET_PASSWORD_URL);
    expect(mailGatewayOf(app).lastMailTo(STAFF_MANAGER.email)).toBeUndefined();
    expect(await findLinks(db, body.userId)).toHaveLength(1);
    await postPasswordLink(app, tokenOf(body.setPasswordUrl), NEW_PASSWORD).expect(HttpStatus.OK);
    expect(emailsOf((await getAdminUsers(app, admin, { role: ROLE.MANAGER })).body)).toEqual([
      STAFF_MANAGER.email,
    ]);
  });
});
