import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ROW_LOCK_SHARE, ROW_LOCK_UPDATE } from '@/common/constants/database.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { serviceZones, tariffs } from '@/database/schema';
import { MANAGER_ZONES_MESSAGES } from '@/modules/manager/constants/manager-zones.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin } from '@test/support/admin';
import {
  findTariffActions,
  insertTariff,
  insertZone,
  postTariffStatus,
} from '@test/support/admin-tariffs';
import { resetTestData, seedServiceArea } from '@test/support/database';
import { commitOnceBlocked } from '@test/support/locks';
import { createManager } from '@test/support/manager';
import { getZone, patchZone } from '@test/support/manager-zones';

describe('Zone switch-on against tariff switch-off (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let manager: string;
  let tariffId: number;
  let zoneId: number;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    await seedServiceArea(db);
    admin = await createAdmin(app, db);
    manager = await createManager(app, db);
    tariffId = await insertTariff(db, 'Бизнес');
    zoneId = await insertZone(db, tariffId, 'Восток', false);
  });

  afterAll(async () => {
    await app.close();
  });

  async function zoneIsActive(): Promise<boolean> {
    const [zone] = await db.select().from(serviceZones).where(eq(serviceZones.zoneId, zoneId));

    return zone.isActive;
  }

  it('should refuse the zone switch-on that waited for the tariff switch-off', async () => {
    const { body } = await getZone(app, manager, zoneId).expect(HttpStatus.OK);
    const switchOff = async (tx: Transaction) => {
      await tx.select().from(tariffs).where(eq(tariffs.tariffId, tariffId)).for(ROW_LOCK_UPDATE);
      await tx.update(tariffs).set({ isActive: false }).where(eq(tariffs.tariffId, tariffId));
    };

    const response = await commitOnceBlocked(db, switchOff, () =>
      patchZone(app, manager, zoneId, { isActive: true, expectedUpdatedAt: body.updatedAt }),
    );

    expect(response.status).toBe(HttpStatus.CONFLICT);
    expect(response.body).toMatchObject({ message: MANAGER_ZONES_MESSAGES.TARIFF_INACTIVE });
    expect(await zoneIsActive()).toBe(false);
  });

  it('should refuse the tariff switch-off that waited for the zone switch-on', async () => {
    const switchOn = async (tx: Transaction) => {
      await tx.select().from(tariffs).where(eq(tariffs.tariffId, tariffId)).for(ROW_LOCK_SHARE);
      await tx.update(serviceZones).set({ isActive: true }).where(eq(serviceZones.zoneId, zoneId));
    };

    const response = await commitOnceBlocked(db, switchOn, () =>
      postTariffStatus(app, admin, tariffId, { isActive: false }),
    );

    expect(response.status).toBe(HttpStatus.CONFLICT);
    expect(response.body.message).toBe('Тариф нельзя выключить: он используется в зоне «Восток»');
    expect(await zoneIsActive()).toBe(true);
    expect(await findTariffActions(db, tariffId)).toEqual([]);
  });
});
