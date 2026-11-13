import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { createTestApp } from '@test/support/app';
import { getAdminUser, getAdminUserCounts, getAdminUsers } from '@test/support/admin';
import { registerUser } from '@test/support/auth';
import { createCourier } from '@test/support/couriers';
import { createManager } from '@test/support/manager';
import { resetTestData } from '@test/support/database';

type Call = (cookies: string | null) => Promise<{ status: number }>;

describe('Admin users access (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientId: number;
  let sessions: Record<string, string>;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
    await resetTestData(db);
    const client = await registerUser(app);
    clientId = client.body.user.userId;
    sessions = {
      [ROLE.CLIENT]: client.cookies,
      [ROLE.COURIER]: await createCourier(app, db),
      [ROLE.MANAGER]: await createManager(app, db),
    };
  });

  afterAll(async () => {
    await app.close();
  });

  const calls: [string, Call][] = [
    ['the users list', (cookies) => getAdminUsers(app, cookies, { role: ROLE.CLIENT })],
    ['the tab counts', (cookies) => getAdminUserCounts(app, cookies)],
    ['the user card', (cookies) => getAdminUser(app, cookies, clientId)],
  ];

  it.each(calls)(
    'should refuse a client, a courier and a manager with 403 when they read %s',
    async (_name, call) => {
      for (const role of [ROLE.CLIENT, ROLE.COURIER, ROLE.MANAGER]) {
        expect((await call(sessions[role])).status).toBe(HttpStatus.FORBIDDEN);
      }
    },
  );

  it.each(calls)('should answer 401 when a guest reads %s', async (_name, call) => {
    expect((await call(null)).status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
