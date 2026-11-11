import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { CAR } from '@test/support/couriers';
import {
  getCourierLookup,
  LOOKUP_BLOCKED,
  LOOKUP_NO_VEHICLE,
  LOOKUP_WITH_CAR,
  type LookupCourierIds,
  seedLookupCouriers,
} from '@test/support/couriers-lookup';
import { createManager } from '@test/support/manager';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT, createUserWithRole } from '@test/support/users';

describe('Courier lookup for a manager (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let ids: LookupCourierIds;
  let courierCookies: string;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ ids, courierCookies } = await seedLookupCouriers(app, db));
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  function lookup(cookies: string | null, query: Record<string, string> = {}) {
    return getCourierLookup(app, cookies, query);
  }

  it('should let a manager and an admin in, and keep a client, a courier and a guest out', async () => {
    const admin = await createUserWithRole(app, db, ADMIN_ACCOUNT, ROLE.ADMIN);
    const { cookies: client } = await registerUser(app);

    await lookup(manager).expect(HttpStatus.OK);
    await lookup(admin).expect(HttpStatus.OK);
    await lookup(client).expect(HttpStatus.FORBIDDEN);
    await lookup(courierCookies).expect(HttpStatus.FORBIDDEN);
    await lookup(null).expect(HttpStatus.UNAUTHORIZED);
  });

  it('should list every courier but the deleted ones by name, blocked and off shift too', async () => {
    const response = await lookup(manager).expect(HttpStatus.OK);

    expect(response.body).toEqual([
      { courierId: ids.withCar, name: `Курьер ${LOOKUP_WITH_CAR.lastName}`, vehicleType: CAR.type },
      { courierId: ids.noVehicle, name: `Курьер ${LOOKUP_NO_VEHICLE.lastName}`, vehicleType: null },
      { courierId: ids.blocked, name: `Курьер ${LOOKUP_BLOCKED.lastName}`, vehicleType: null },
    ]);
    expect(response.body.map((item: { courierId: number }) => item.courierId)).not.toContain(
      ids.deleted,
    );
  });

  it('should find a courier by a part of the name or by the phone', async () => {
    const byName = await lookup(manager, { q: 'борис' }).expect(HttpStatus.OK);
    const byPhone = await lookup(manager, { q: '29 200-00-03' }).expect(HttpStatus.OK);
    const deleted = await lookup(manager, { q: 'Григорьев' }).expect(HttpStatus.OK);

    expect(byName.body).toEqual([expect.objectContaining({ courierId: ids.noVehicle })]);
    expect(byPhone.body).toEqual([expect.objectContaining({ courierId: ids.blocked })]);
    expect(deleted.body).toEqual([]);
  });

  it('should take at most the limit', async () => {
    const response = await lookup(manager, { limit: '2' }).expect(HttpStatus.OK);

    expect(response.body.map((item: { courierId: number }) => item.courierId)).toEqual([
      ids.withCar,
      ids.noVehicle,
    ]);
  });

  it('should refuse a wrong limit, a short text and an unknown parameter', async () => {
    const queries: Record<string, string>[] = [
      { limit: '0' },
      { limit: '21' },
      { q: 'Ку' },
      { state: 'free' },
    ];

    for (const query of queries) {
      await lookup(manager, query).expect(HttpStatus.BAD_REQUEST);
    }
  });
});
