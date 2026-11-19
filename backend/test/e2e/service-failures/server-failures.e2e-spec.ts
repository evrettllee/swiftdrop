import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { INTERNAL_ERROR_MESSAGE } from '@/common/constants/http.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { AdminUserCardService } from '@/modules/admin/services/admin-user-card.service';
import { createTestApp } from '@test/support/app';
import { createAdmin, getAdminUser } from '@test/support/admin';
import { getAdminAnalytics } from '@test/support/admin-analytics';
import { resetTestData } from '@test/support/database';
import { mailGatewayOf } from '@test/support/mail';
import { postStaff, STAFF_MANAGER } from '@test/support/admin-staff';
import { readFailures, waitForFailures } from '@test/support/service-failures';

const SECRET_ID = 'ivan.petrov@example.com';

describe('Server failures (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  const get = jest.fn<Promise<unknown>, [number]>();

  beforeAll(async () => {
    app = await createTestApp([{ token: AdminUserCardService, useValue: { get } }]);
    db = app.get<Database>(DRIZZLE);
    await resetTestData(db);
    admin = await createAdmin(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should answer 500 as before and record the route template, not the address', async () => {
    get.mockRejectedValueOnce(new TypeError(`Cannot read ${SECRET_ID}`));

    const { body } = await getAdminUser(app, admin, 4711).expect(HttpStatus.INTERNAL_SERVER_ERROR);

    expect(body.message).toBe(INTERNAL_ERROR_MESSAGE);
    const rows = await waitForFailures(db, 1);
    expect(rows.map((row) => [row.service, row.code, row.message])).toEqual([
      ['server', 'internal_error', 'GET /api/admin/users/:userId: TypeError'],
    ]);
    expect(JSON.stringify(rows)).not.toMatch(/4711|ivan/);
  });

  it('should not record a 503 thrown on purpose', async () => {
    get.mockRejectedValueOnce(new ServiceUnavailableException('Сервис недоступен'));

    await getAdminUser(app, admin, 1).expect(HttpStatus.SERVICE_UNAVAILABLE);

    expect(await waitForFailures(db, 2)).toHaveLength(1);
  });

  it('should show the recorded failures in the service tab of the analytics', async () => {
    mailGatewayOf(app).failNextSend();
    await postStaff(app, admin, STAFF_MANAGER).expect(HttpStatus.CREATED);
    await waitForFailures(db, 2);
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Minsk' }).format(new Date());

    const { body } = await getAdminAnalytics(app, admin, 'service', {
      from: today,
      to: today,
    }).expect(HttpStatus.OK);

    expect(body.kpis.serverErrors.value).toBe(1);
    expect(body.kpis.mailFailures).toEqual({ count: 1, lastAt: expect.any(String) });
    expect(body.services[2]).toMatchObject({
      service: 'mail',
      failures: 1,
      lastCode: 'send_failed',
    });
    expect(body.recent.map((row: { code: string }) => row.code)).toEqual([
      'send_failed',
      'internal_error',
    ]);
    expect(await readFailures(db)).toHaveLength(2);
  });
});
