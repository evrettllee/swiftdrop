import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { TEST_TARIFF, TEST_ZONE_NAME } from '@test/support/constants';
import { createManager } from '@test/support/manager';
import {
  getTariffs,
  getZone,
  getZones,
  patchZone,
  postZone,
  WEST_POINT,
  WEST_POLYGON,
} from '@test/support/manager-zones';
import { postEstimate, resetServiceArea, validEstimate } from '@test/support/pricing';
import { ADMIN_ACCOUNT, createUserWithRole } from '@test/support/users';

type Zone = { id: number; updatedAt: string; isActive: boolean };

describe('Service zones for a manager (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let testZone: Zone;
  const getRoute = jest.fn();
  const westZone = { name: 'Запад', polygon: WEST_POLYGON, tariffId: 1, priority: 5 };

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    manager = await createManager(app, db);
    [testZone] = (await getZones(app, manager).expect(HttpStatus.OK)).body as Zone[];
  });

  afterAll(async () => {
    await app.close();
  });

  it('should let a manager and an admin in, and keep a client and a guest out', async () => {
    const admin = await createUserWithRole(app, db, ADMIN_ACCOUNT, ROLE.ADMIN);
    const { cookies: client } = await registerUser(app);

    await getZones(app, admin).expect(HttpStatus.OK);
    await getTariffs(app, manager).expect(HttpStatus.OK);
    await getZones(app, client).expect(HttpStatus.FORBIDDEN);
    await postZone(app, client, westZone).expect(HttpStatus.FORBIDDEN);
    await patchZone(app, client, testZone.id, { priority: 1 }).expect(HttpStatus.FORBIDDEN);
    await getZones(app, null).expect(HttpStatus.UNAUTHORIZED);
  });

  it('should list the zones without the polygon and give one with it', async () => {
    const list = await getZones(app, manager).expect(HttpStatus.OK);
    const one = await getZone(app, manager, testZone.id).expect(HttpStatus.OK);
    const tariffs = await getTariffs(app, manager).expect(HttpStatus.OK);

    expect(list.body).toEqual([
      {
        id: testZone.id,
        name: TEST_ZONE_NAME,
        tariff: { id: 1, name: TEST_TARIFF.name },
        priority: 0,
        isActive: true,
        vertexCount: 4,
        areaKm2: expect.any(Number),
        updatedAt: expect.any(String),
      },
    ]);
    expect(one.body.polygon[0]).toHaveLength(5);
    expect(tariffs.body).toEqual([{ id: 1, name: TEST_TARIFF.name }]);
    await getZone(app, manager, 999).expect(HttpStatus.NOT_FOUND);
  });

  it('should price in a new zone at once and stop pricing in a switched off one', async () => {
    const westEstimate = { ...validEstimate, pickup: WEST_POINT };
    await postEstimate(app, westEstimate).expect(HttpStatus.UNPROCESSABLE_ENTITY);

    const created = await postZone(app, manager, westZone).expect(HttpStatus.CREATED);
    await postEstimate(app, westEstimate).expect(HttpStatus.OK);
    const switched = await patchZone(app, manager, testZone.id, {
      isActive: false,
      expectedUpdatedAt: testZone.updatedAt,
    }).expect(HttpStatus.OK);

    expect(created.body).toMatchObject({
      name: 'Запад',
      priority: 5,
      isActive: true,
      vertexCount: 4,
    });
    expect(switched.body).toMatchObject({ isActive: false });
    expect(switched.body.updatedAt).not.toBe(testZone.updatedAt);
    await postEstimate(app, validEstimate).expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('should refuse a taken name, an unknown tariff and a bad polygon', async () => {
    const taken = await postZone(app, manager, { ...westZone, name: TEST_ZONE_NAME.toUpperCase() });
    const tariff = await postZone(app, manager, { ...westZone, tariffId: 99 });
    const eight = await postZone(app, manager, {
      ...westZone,
      polygon: [
        [
          [27.1, 53.85],
          [27.3, 53.95],
          [27.3, 53.85],
          [27.1, 53.95],
        ],
      ],
    });

    expect(taken.status).toBe(HttpStatus.CONFLICT);
    expect(taken.body).toMatchObject({ code: 'ZONE_NAME_TAKEN' });
    expect(tariff.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(tariff.body).toMatchObject({ code: 'TARIFF_NOT_FOUND' });
    expect(eight.status).toBe(HttpStatus.BAD_REQUEST);
    expect(eight.body).toMatchObject({ code: 'INVALID_POLYGON', reason: 'self_intersection' });
  });

  it('should refuse a stale change, the last active zone and an empty change', async () => {
    const stale = await patchZone(app, manager, testZone.id, {
      priority: 3,
      expectedUpdatedAt: new Date(0).toISOString(),
    });
    const last = await patchZone(app, manager, testZone.id, {
      isActive: false,
      expectedUpdatedAt: testZone.updatedAt,
    });

    expect(stale.status).toBe(HttpStatus.CONFLICT);
    expect(stale.body).toMatchObject({ code: 'ZONE_CHANGED', updatedAt: testZone.updatedAt });
    expect(last.status).toBe(HttpStatus.CONFLICT);
    expect(last.body).toMatchObject({ code: 'LAST_ACTIVE_ZONE' });
    await patchZone(app, manager, testZone.id, { expectedUpdatedAt: testZone.updatedAt }).expect(
      HttpStatus.BAD_REQUEST,
    );
    await patchZone(app, manager, 999, {
      priority: 1,
      expectedUpdatedAt: testZone.updatedAt,
    }).expect(HttpStatus.NOT_FOUND);
  });
});
