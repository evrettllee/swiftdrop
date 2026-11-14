import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { createAdmin, insertUser } from '@test/support/admin';
import { getAdminAnalytics } from '@test/support/admin-analytics';
import { insertCourier, type OrderSeed, shapeOrders } from '@test/support/admin-analytics-blocks';
import { ANALYTICS_PERIOD as PERIOD } from '@test/support/admin-analytics-plans';
import { registerUser } from '@test/support/auth';
import { placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

const client = (email: string, createdAt: string) => ({
  role: ROLE.CLIENT,
  email,
  createdAt: new Date(createdAt),
});

describe('Admin analytics users (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
    admin = await createAdmin(app, db);
    const placer = await registerUser(app);
    const a = await insertUser(db, client('a@example.com', '2026-10-02T09:00:00Z'));
    const b = await insertUser(db, client('b@example.com', '2026-10-02T20:30:00Z'));
    const c = await insertUser(db, client('c@example.com', '2026-10-05T09:00:00Z'));
    const d = await insertUser(db, client('d@example.com', '2026-09-25T09:00:00Z'));
    await insertUser(db, {
      ...client('e@example.com', '2026-10-03T09:00:00Z'),
      deletedAt: new Date(),
    });
    await insertUser(db, client('f@example.com', '2026-09-30T21:30:00Z'));
    const first = await insertCourier(db, { email: 'c1@example.com', onShift: true });
    const second = await insertCourier(db, { email: 'c2@example.com' });
    await insertCourier(db, { email: 'c3@example.com', onShift: true, isBlocked: true });
    await insertCourier(db, { email: 'c4@example.com', onShift: true, deleted: true });
    await insertCourier(db, { email: 'c5@example.com', onShift: true, invited: true });
    const delivered = (clientId: number, day: string, courierId: number): OrderSeed => ({
      clientId,
      createdAt: `${day}T08:00:00Z`,
      status: ORDER_STATUS.DELIVERED,
      finishedAt: `${day}T09:00:00Z`,
      courierId,
    });
    const placed = (clientId: number, day: string): OrderSeed => ({
      clientId,
      createdAt: `${day}T08:00:00Z`,
    });
    const seeds = [
      placed(a, '2026-10-02'),
      placed(b, '2026-10-03'),
      placed(b, '2026-10-04'),
      placed(c, '2026-10-05'),
      placed(c, '2026-10-05'),
      delivered(c, '2026-10-06', second),
      ...['2026-10-03', '2026-10-04', '2026-10-05'].map((day) => delivered(d, day, first)),
      ...['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-06'].map((day) => placed(d, day)),
      delivered(a, '2026-09-27', first),
      placed(a, '2026-09-28'),
      placed(b, '2026-09-28'),
    ];
    await shapeOrders(db, await placeOrders(app, placer.cookies, seeds.length), seeds);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should count the KPIs of the period against the previous one', async () => {
    const { body } = await getAdminAnalytics(app, admin, 'users', PERIOD).expect(HttpStatus.OK);

    expect(body.period).toEqual(PERIOD);
    expect(body.kpis).toEqual({
      newClients: { value: 5, previous: 1 },
      activeClients: { value: 4, previous: 2 },
      repeatClients: {
        value: { repeat: 3, active: 4 },
        previous: { repeat: 1, active: 2 },
      },
      couriersOnline: { onShift: 1, total: 2 },
      averageDeliveriesPerCourier: { value: 2, previous: 1 },
    });
  });

  it('should give the new clients of every Minsk day with zeros', async () => {
    const { body } = await getAdminAnalytics(app, admin, 'users', PERIOD).expect(HttpStatus.OK);

    expect(body.newClientsByDay).toEqual([
      { date: '2026-10-01', count: 1 },
      { date: '2026-10-02', count: 2 },
      { date: '2026-10-03', count: 1 },
      { date: '2026-10-04', count: 0 },
      { date: '2026-10-05', count: 1 },
      { date: '2026-10-06', count: 0 },
      { date: '2026-10-07', count: 0 },
    ]);
  });

  it('should split the active clients by the orders they placed in the period', async () => {
    const { body } = await getAdminAnalytics(app, admin, 'users', PERIOD).expect(HttpStatus.OK);

    expect(body.ordersPerClient).toEqual({ one: 1, two: 1, threeToFive: 1, sixPlus: 1 });
  });
});
