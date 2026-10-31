import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orderOffers } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { CAR, placeCourierAt } from '@test/support/couriers';
import {
  getCouriersMap,
  MAP_FREE,
  MAP_STALE_AT,
  type MapCourierIds,
  seedCouriersMap,
} from '@test/support/couriers-map';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { createManager } from '@test/support/manager';
import { type Cookies, placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT, createUserWithRole } from '@test/support/users';

describe('Couriers map for a manager (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: Cookies;
  let manager: string;
  let ids: MapCourierIds;
  let orderIds: number[];
  let courierCookies: string;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: client } = await registerUser(app));
    orderIds = await placeOrders(app, client, 2);
    await setOrderStatus(db, orderIds[1], ORDER_STATUS.CONFIRMED);
    ({ ids, freeCookies: courierCookies } = await seedCouriersMap(app, db, orderIds));
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  function getMap(cookies: string | null, query: Record<string, string> = {}) {
    return getCouriersMap(app, cookies, query);
  }

  it('should let a manager and an admin in, and keep a client, a courier and a guest out', async () => {
    const admin = await createUserWithRole(app, db, ADMIN_ACCOUNT, ROLE.ADMIN);

    await getMap(manager).expect(HttpStatus.OK);
    await getMap(admin).expect(HttpStatus.OK);
    await getMap(client).expect(HttpStatus.FORBIDDEN);
    await getMap(courierCookies).expect(HttpStatus.FORBIDDEN);
    await getMap(null).expect(HttpStatus.UNAUTHORIZED);
  });

  it('should show the couriers on shift or with an order by name, with their state', async () => {
    const response = await getMap(manager).expect(HttpStatus.OK);

    expect(response.body.counts).toEqual({ free: 1, on_order: 1, offer: 1, no_signal: 1 });
    expect(response.body.items).toEqual([
      expect.objectContaining({
        courierId: ids.free,
        name: `Курьер ${MAP_FREE.lastName}`,
        phone: MAP_FREE.phone,
        vehicleType: CAR.type,
        lat: MINSK_PICKUP.latitude,
        lng: MINSK_PICKUP.longitude,
        positionAt: expect.any(String),
        positionAgeSec: expect.any(Number),
        state: 'free',
        activeOrder: null,
        openOfferOrderId: null,
      }),
      expect.objectContaining({
        courierId: ids.onOrder,
        state: 'on_order',
        activeOrder: { orderId: orderIds[0], status: ORDER_STATUS.COURIER_ASSIGNED },
      }),
      expect.objectContaining({
        courierId: ids.offer,
        state: 'offer',
        openOfferOrderId: orderIds[1],
      }),
      expect.objectContaining({ courierId: ids.noSignal, state: 'no_signal' }),
    ]);
  });

  it('should put an order above an offer and no signal above both', async () => {
    await db
      .update(orderOffers)
      .set({ courierId: ids.onOrder })
      .where(eq(orderOffers.courierId, ids.offer));
    const statesNow = async () => {
      const response = await getMap(manager).expect(HttpStatus.OK);

      return Object.fromEntries(
        (response.body.items as { courierId: number; state: string }[]).map((item) => [
          item.courierId,
          item.state,
        ]),
      );
    };

    expect((await statesNow())[ids.onOrder]).toBe('on_order');
    expect((await statesNow())[ids.offer]).toBe('free');

    await placeCourierAt(db, ids.onOrder, MINSK_PICKUP, MAP_STALE_AT);

    expect((await statesNow())[ids.onOrder]).toBe('no_signal');
  });

  it('should filter by state, vehicle and search and count the states without the state filter', async () => {
    const byState = await getMap(manager, { state: 'free,offer' }).expect(HttpStatus.OK);
    const byName = await getMap(manager, { q: 'Васильев' }).expect(HttpStatus.OK);
    const byPhone = await getMap(manager, { q: '8 033 100 00 01' }).expect(HttpStatus.OK);
    const byVehicle = await getMap(manager, { vehicleType: 'foot' }).expect(HttpStatus.OK);

    expect(byState.body.items.map((item: { courierId: number }) => item.courierId)).toEqual([
      ids.free,
      ids.offer,
    ]);
    expect(byState.body.counts).toEqual({ free: 1, on_order: 1, offer: 1, no_signal: 1 });
    expect(byName.body.items).toEqual([expect.objectContaining({ courierId: ids.offer })]);
    expect(byName.body.counts).toEqual({ free: 0, on_order: 0, offer: 1, no_signal: 0 });
    expect(byPhone.body.items).toEqual([expect.objectContaining({ courierId: ids.free })]);
    expect(byVehicle.body).toEqual({
      items: [],
      counts: { free: 0, on_order: 0, offer: 0, no_signal: 0 },
    });
  });

  it.each([[{ state: 'busy' }], [{ page: '1' }], [{ vehicleType: 'rocket' }], [{ q: 'Ив' }]])(
    'should refuse %j with 400',
    async (query) => {
      await getMap(manager, query).expect(HttpStatus.BAD_REQUEST);
    },
  );
});
