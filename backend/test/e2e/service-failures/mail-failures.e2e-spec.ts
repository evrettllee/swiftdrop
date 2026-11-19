import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { createTestApp } from '@test/support/app';
import { createAdmin } from '@test/support/admin';
import { postStaff, STAFF_MANAGER } from '@test/support/admin-staff';
import { resetTestData } from '@test/support/database';
import { mailGatewayOf } from '@test/support/mail';
import { waitForFailures } from '@test/support/service-failures';

describe('Mail failures on a staff invite (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
    await resetTestData(db);
    admin = await createAdmin(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should answer emailSent false and record the failure without the address or the link', async () => {
    mailGatewayOf(app).failNextSend();

    const { body } = await postStaff(app, admin, STAFF_MANAGER).expect(HttpStatus.CREATED);

    expect(body.emailSent).toBe(false);
    const rows = await waitForFailures(db, 1);
    expect(rows.map((row) => [row.service, row.code, row.message, row.repeats])).toEqual([
      ['mail', 'send_failed', 'EAUTH', 1],
    ]);
    expect(JSON.stringify(rows)).not.toContain(STAFF_MANAGER.email);
    expect(JSON.stringify(rows)).not.toContain('set-password');
  });

  it('should record nothing when the letter is sent', async () => {
    await postStaff(app, admin, {
      ...STAFF_MANAGER,
      email: 'second@example.com',
      phone: '+375295556677',
    })
      .expect(HttpStatus.CREATED)
      .expect((response) => expect(response.body.emailSent).toBe(true));

    expect(await waitForFailures(db, 2)).toHaveLength(1);
  });
});
