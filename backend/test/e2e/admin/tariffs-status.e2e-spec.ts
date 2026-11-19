import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { ADMIN_TARIFF_MESSAGES } from '@/modules/admin/constants/admin-tariffs.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin } from '@test/support/admin';
import {
  findTariffActions,
  findTariffId,
  insertTariff,
  insertZone,
  postTariffStatus,
} from '@test/support/admin-tariffs';
import { resetTestData, seedServiceArea } from '@test/support/database';

describe('Admin tariff status (e2e)', () => {
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

  it('should turn off a tariff without zones and turn it on again', async () => {
    const tariffId = await insertTariff(db, 'Бизнес');

    const off = await postTariffStatus(app, admin, tariffId, { isActive: false }).expect(
      HttpStatus.OK,
    );
    const on = await postTariffStatus(app, admin, tariffId, { isActive: true }).expect(
      HttpStatus.OK,
    );

    expect(off.body.isActive).toBe(false);
    expect(on.body.isActive).toBe(true);
    expect((await findTariffActions(db, tariffId)).map((row) => row.action)).toEqual([
      ADMIN_ACTION.TARIFF_DISABLED,
      ADMIN_ACTION.TARIFF_ENABLED,
    ]);
  });

  it('should refuse to turn off a tariff of active zones and name them', async () => {
    const tariffId = await findTariffId(db);
    await insertZone(db, tariffId, 'Восток');
    await insertZone(db, tariffId, 'Архив', false);

    const response = await postTariffStatus(app, admin, tariffId, { isActive: false }).expect(
      HttpStatus.CONFLICT,
    );

    expect(response.body.message).toBe(
      'Тариф нельзя выключить: он используется в зоне «Test zone», «Восток»',
    );
    expect(await findTariffActions(db, tariffId)).toEqual([]);
  });

  it('should turn off a tariff bound only to inactive zones', async () => {
    const tariffId = await insertTariff(db, 'Бизнес');
    await insertZone(db, tariffId, 'Архив', false);

    const response = await postTariffStatus(app, admin, tariffId, { isActive: false }).expect(
      HttpStatus.OK,
    );

    expect(response.body).toMatchObject({
      isActive: false,
      zones: [{ name: 'Архив', isActive: false }],
    });
  });

  it('should write nothing when the value does not change', async () => {
    const tariffId = await findTariffId(db);

    const response = await postTariffStatus(app, admin, tariffId, { isActive: true }).expect(
      HttpStatus.OK,
    );

    expect(response.body.updatedBy).toBeNull();
    expect(await findTariffActions(db, tariffId)).toEqual([]);
  });

  it('should answer 400 for a bad body and 404 for an unknown tariff', async () => {
    const tariffId = await findTariffId(db);

    await postTariffStatus(app, admin, tariffId, { isActive: 'no' }).expect(HttpStatus.BAD_REQUEST);
    await postTariffStatus(app, admin, tariffId, {}).expect(HttpStatus.BAD_REQUEST);
    const unknown = await postTariffStatus(app, admin, 999_999, { isActive: false }).expect(
      HttpStatus.NOT_FOUND,
    );
    expect(unknown.body.message).toBe(ADMIN_TARIFF_MESSAGES.NOT_FOUND);
  });
});
