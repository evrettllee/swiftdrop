import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { MONEY_MESSAGES } from '@/common/schemas/money.schema';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { tariffs } from '@/database/schema';
import { ADMIN_TARIFF_MESSAGES } from '@/modules/admin/constants/admin-tariffs.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin } from '@test/support/admin';
import { EXPRESS_TARIFF, findTariffActions, postTariff } from '@test/support/admin-tariffs';
import { resetTestData } from '@test/support/database';
import { ADMIN_ACCOUNT } from '@test/support/users';

describe('Admin tariff create (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    admin = await createAdmin(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create an active tariff and log it', async () => {
    const { body } = await postTariff(app, admin, {
      ...EXPRESS_TARIFF,
      name: `  ${EXPRESS_TARIFF.name} `,
    }).expect(HttpStatus.CREATED);

    expect(body).toEqual({
      tariffId: expect.any(Number),
      ...EXPRESS_TARIFF,
      isActive: true,
      zones: [],
      updatedAt: expect.any(String),
      updatedBy: { firstName: ADMIN_ACCOUNT.firstName, lastName: ADMIN_ACCOUNT.lastName },
    });
    expect(await findTariffActions(db, body.tariffId)).toEqual([
      { action: ADMIN_ACTION.TARIFF_CREATED, details: {} },
    ]);
  });

  it.each([
    ['pricePerKm', 0, MONEY_MESSAGES.POSITIVE],
    ['pricePerKm', 100.01, MONEY_MESSAGES.MAX(100)],
    ['pricePerKg', 1.234, MONEY_MESSAGES.TWO_DECIMALS],
    ['pricePerKg', 101, MONEY_MESSAGES.MAX(100)],
    ['minPrice', -5, MONEY_MESSAGES.POSITIVE],
    ['minPrice', 1000.5, MONEY_MESSAGES.MAX(1000)],
    ['fragileFee', '3', MONEY_MESSAGES.POSITIVE],
    ['fragileFee', 1001, MONEY_MESSAGES.MAX(1000)],
    ['name', 'Э', ADMIN_TARIFF_MESSAGES.NAME_LENGTH],
    ['name', 'Э'.repeat(51), ADMIN_TARIFF_MESSAGES.NAME_LENGTH],
  ])('should answer 400 for %s = %p', async (field, value, message) => {
    const response = await postTariff(app, admin, { ...EXPRESS_TARIFF, [field]: value }).expect(
      HttpStatus.BAD_REQUEST,
    );

    expect(response.body.errors).toEqual([{ field, message }]);
    expect(await db.select().from(tariffs)).toEqual([]);
  });

  it('should answer 400 for an unknown key', async () => {
    await postTariff(app, admin, { ...EXPRESS_TARIFF, isActive: false }).expect(
      HttpStatus.BAD_REQUEST,
    );
  });

  it('should answer 409 for a taken name in another case', async () => {
    await postTariff(app, admin, EXPRESS_TARIFF).expect(HttpStatus.CREATED);

    const response = await postTariff(app, admin, {
      ...EXPRESS_TARIFF,
      name: EXPRESS_TARIFF.name.toUpperCase(),
    }).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(ADMIN_TARIFF_MESSAGES.NAME_TAKEN);
    expect(await db.select().from(tariffs)).toHaveLength(1);
  });
});
