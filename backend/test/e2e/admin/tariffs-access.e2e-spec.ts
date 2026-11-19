import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { tariffs } from '@/database/schema';
import { createTestApp } from '@test/support/app';
import {
  EXPRESS_TARIFF,
  findTariffActions,
  findTariffId,
  getAdminTariffs,
  patchTariff,
  postTariff,
  postTariffStatus,
} from '@test/support/admin-tariffs';
import { registerUser } from '@test/support/auth';
import { createCourier } from '@test/support/couriers';
import { resetTestData, seedServiceArea } from '@test/support/database';
import { createManager } from '@test/support/manager';

type Call = (cookies: string | null) => Promise<{ status: number }>;

describe('Admin tariffs access (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let tariffId: number;
  let sessions: Record<string, string>;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
    await resetTestData(db);
    await seedServiceArea(db);
    tariffId = await findTariffId(db);
    sessions = {
      [ROLE.CLIENT]: (await registerUser(app)).cookies,
      [ROLE.COURIER]: await createCourier(app, db),
      [ROLE.MANAGER]: await createManager(app, db),
    };
  });

  afterAll(async () => {
    await app.close();
  });

  const calls: [string, Call][] = [
    ['the list', (cookies) => getAdminTariffs(app, cookies)],
    ['the create', (cookies) => postTariff(app, cookies, EXPRESS_TARIFF)],
    ['the edit', (cookies) => patchTariff(app, cookies, tariffId, { minPrice: 9 })],
    ['the status', (cookies) => postTariffStatus(app, cookies, tariffId, { isActive: false })],
  ];

  it.each(calls)(
    'should refuse a client, a courier and a manager with 403 for %s',
    async (_name, call) => {
      for (const role of [ROLE.CLIENT, ROLE.COURIER, ROLE.MANAGER]) {
        expect((await call(sessions[role])).status).toBe(HttpStatus.FORBIDDEN);
      }

      expect(await db.select().from(tariffs)).toHaveLength(1);
      expect(await findTariffActions(db, tariffId)).toEqual([]);
    },
  );

  it.each(calls)('should answer 401 to a guest for %s', async (_name, call) => {
    expect((await call(null)).status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
