import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { createTestApp } from '@test/support/app';
import { createAdmin } from '@test/support/admin';
import {
  findTariffId,
  getAdminTariffs,
  insertTariff,
  insertZone,
  patchTariff,
} from '@test/support/admin-tariffs';
import { resetTestData, seedServiceArea } from '@test/support/database';
import { TEST_TARIFF, TEST_ZONE_NAME } from '@test/support/constants';
import { ADMIN_ACCOUNT } from '@test/support/users';

describe('Admin tariffs list (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    await seedServiceArea(db);
    admin = await createAdmin(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should give active tariffs first, then by name, with zones and prices as numbers', async () => {
    const seeded = await findTariffId(db);
    const off = await insertTariff(db, 'Архивный', false);
    const another = await insertTariff(db, 'Бизнес');
    const hidden = await insertZone(db, another, 'Пригород', false);

    const { body } = await getAdminTariffs(app, admin).expect(HttpStatus.OK);

    expect(body.map((item: { tariffId: number }) => item.tariffId)).toEqual([seeded, another, off]);
    expect(body[0]).toEqual({
      tariffId: seeded,
      name: TEST_TARIFF.name,
      pricePerKm: 1,
      pricePerKg: 0.5,
      minPrice: 5,
      fragileFee: 2,
      isActive: true,
      zones: [{ zoneId: expect.any(Number), name: TEST_ZONE_NAME, isActive: true }],
      updatedAt: expect.any(String),
      updatedBy: null,
    });
    expect(body[1].zones).toEqual([{ zoneId: hidden, name: 'Пригород', isActive: false }]);
    expect(body[2]).toMatchObject({ isActive: false, zones: [], updatedBy: null });
  });

  it('should name the admin of the latest change', async () => {
    const seeded = await findTariffId(db);
    await patchTariff(app, admin, seeded, { minPrice: 6 }).expect(HttpStatus.OK);

    const { body } = await getAdminTariffs(app, admin).expect(HttpStatus.OK);

    expect(body[0].updatedBy).toEqual({
      firstName: ADMIN_ACCOUNT.firstName,
      lastName: ADMIN_ACCOUNT.lastName,
    });
  });
});
