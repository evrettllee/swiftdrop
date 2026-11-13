import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId } from '@test/support/admin';
import { patchAdminUser, postResend, postStaff, STAFF_COURIER } from '@test/support/admin-staff';
import { registerUser } from '@test/support/auth';
import { createCourier } from '@test/support/couriers';
import { resetTestData } from '@test/support/database';
import { mailGatewayOf } from '@test/support/mail';
import { createManager } from '@test/support/manager';
import { ADMIN_ACCOUNT, findUsers } from '@test/support/users';

type Call = (cookies: string | null) => Promise<{ status: number }>;

describe('Admin staff access (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let invitedId: number;
  let sessions: Record<string, string>;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
    await resetTestData(db);
    admin = await createAdmin(app, db);
    sessions = {
      [ROLE.CLIENT]: (await registerUser(app)).cookies,
      [ROLE.COURIER]: await createCourier(app, db),
      [ROLE.MANAGER]: await createManager(app, db),
    };
    const invited = await postStaff(app, admin, STAFF_COURIER).expect(HttpStatus.CREATED);
    invitedId = invited.body.userId;
    mailGatewayOf(app).clearSentMails();
  });

  afterAll(async () => {
    await app.close();
  });

  const calls: [string, Call][] = [
    [
      'the staff invite',
      (cookies) =>
        postStaff(app, cookies, { ...STAFF_COURIER, email: 'new@x.by', phone: '+375290000001' }),
    ],
    ['the invite resend', (cookies) => postResend(app, cookies, invitedId)],
    [
      'the staff edit',
      (cookies) => patchAdminUser(app, cookies, invitedId, { lastName: 'Новиков' }),
    ],
  ];

  it.each(calls)(
    'should refuse a client, a courier and a manager with 403 when they call %s',
    async (_name, call) => {
      const usersBefore = (await findUsers(db)).length;

      for (const role of [ROLE.CLIENT, ROLE.COURIER, ROLE.MANAGER]) {
        expect((await call(sessions[role])).status).toBe(HttpStatus.FORBIDDEN);
      }

      expect(await findUsers(db)).toHaveLength(usersBefore);
      expect(mailGatewayOf(app).sentMails).toHaveLength(0);
    },
  );

  it.each(calls)('should answer 401 when a guest calls %s', async (_name, call) => {
    expect((await call(null)).status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should answer 404 when the admin edits another admin', async () => {
    const adminId = await findUserId(db, ADMIN_ACCOUNT.email);

    await patchAdminUser(app, admin, adminId, { lastName: 'Новиков' }).expect(HttpStatus.NOT_FOUND);
  });
});
