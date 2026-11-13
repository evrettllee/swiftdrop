import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { MANAGER_ZONES_MESSAGES } from '@/modules/manager/constants/manager-zones.constants';
import { createTestApp } from '@test/support/app';
import { findTariffId, insertTariff, insertZone } from '@test/support/admin-tariffs';
import { createManager } from '@test/support/manager';
import {
  getTariffs,
  getZone,
  patchZone,
  postZone,
  WEST_POLYGON,
} from '@test/support/manager-zones';
import { resetServiceArea } from '@test/support/pricing';

const TARIFF_INACTIVE = {
  code: 'TARIFF_INACTIVE',
  message: MANAGER_ZONES_MESSAGES.TARIFF_INACTIVE,
};

describe('Manager zones and inactive tariffs (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let offTariff: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    manager = await createManager(app, db);
    offTariff = await insertTariff(db, 'Архивный', false);
  });

  afterAll(async () => {
    await app.close();
  });

  async function updatedAtOf(zoneId: number): Promise<string> {
    const response = await getZone(app, manager, zoneId).expect(HttpStatus.OK);

    return response.body.updatedAt;
  }

  it('should refuse a new zone on an inactive tariff', async () => {
    const response = await postZone(app, manager, {
      name: 'Запад',
      polygon: WEST_POLYGON,
      tariffId: offTariff,
      priority: 5,
    }).expect(HttpStatus.CONFLICT);

    expect(response.body).toMatchObject(TARIFF_INACTIVE);
  });

  it('should refuse to bind a zone to an inactive tariff', async () => {
    const zoneId = await insertZone(db, await findTariffId(db), 'Восток');

    const response = await patchZone(app, manager, zoneId, {
      tariffId: offTariff,
      expectedUpdatedAt: await updatedAtOf(zoneId),
    }).expect(HttpStatus.CONFLICT);

    expect(response.body).toMatchObject(TARIFF_INACTIVE);
  });

  it('should refuse to turn on a zone whose tariff is inactive and allow other edits', async () => {
    const zoneId = await insertZone(db, offTariff, 'Архив', false);

    const on = await patchZone(app, manager, zoneId, {
      isActive: true,
      expectedUpdatedAt: await updatedAtOf(zoneId),
    }).expect(HttpStatus.CONFLICT);
    await patchZone(app, manager, zoneId, {
      priority: 7,
      expectedUpdatedAt: await updatedAtOf(zoneId),
    }).expect(HttpStatus.OK);

    expect(on.body).toMatchObject(TARIFF_INACTIVE);
  });

  it('should offer the manager only active tariffs', async () => {
    await insertTariff(db, 'Бизнес');

    const response = await getTariffs(app, manager).expect(HttpStatus.OK);

    expect(response.body.map((tariff: { name: string }) => tariff.name)).toEqual([
      'Test tariff',
      'Бизнес',
    ]);
  });
});
