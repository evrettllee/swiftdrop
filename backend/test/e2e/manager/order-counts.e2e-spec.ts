import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { createCourier } from '@test/support/couriers';
import {
  createManager,
  getManagerCounts,
  getManagerOrders,
  type ManagerListBody,
} from '@test/support/manager';
import { placeOrders, SECOND_CLIENT, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

const GROUPS = ['attention', 'active', 'awaiting_payment', 'finished', 'cancelled'] as const;
const COUNT_KEYS = {
  attention: 'attention',
  active: 'active',
  awaiting_payment: 'awaitingPayment',
  finished: 'finished',
  cancelled: 'cancelled',
} as const;

describe('Manager order counts (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let ids: number[];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const client = await registerUser(app);
    const second = await registerUser(app, SECOND_CLIENT);
    ids = [
      ...(await placeOrders(app, client.cookies, 4)),
      ...(await placeOrders(app, second.cookies, 2)),
    ];
    await setOrderStatus(db, ids[0], ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT);
    await setOrderStatus(db, ids[1], ORDER_STATUS.IN_TRANSIT);
    await setOrderStatus(db, ids[2], ORDER_STATUS.DELIVERED);
    await setOrderStatus(db, ids[3], ORDER_STATUS.CANCELLED);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refuse a client and a courier', async () => {
    const client = await registerUser(app, {
      ...SECOND_CLIENT,
      email: 'c@example.com',
      phone: '+375291112233',
    });
    const courier = await createCourier(app, db);

    await getManagerCounts(app, client.cookies).expect(HttpStatus.FORBIDDEN);
    await getManagerCounts(app, courier).expect(HttpStatus.FORBIDDEN);
  });

  it('should count every tab', async () => {
    const response = await getManagerCounts(app, manager).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      attention: 1,
      active: 1,
      awaitingPayment: 2,
      finished: 1,
      cancelled: 1,
      all: 6,
    });
  });

  it('should agree with the totals of the list under the same filters and bound', async () => {
    const filters = { q: 'Петр', until: ids[4] };
    const counts = (await getManagerCounts(app, manager, filters).expect(HttpStatus.OK))
      .body as Record<string, number>;

    for (const group of GROUPS) {
      const list = (
        await getManagerOrders(app, manager, { ...filters, status: group }).expect(HttpStatus.OK)
      ).body as ManagerListBody;

      expect(list.total).toBe(counts[COUNT_KEYS[group]]);
    }

    const all = (await getManagerOrders(app, manager, filters).expect(HttpStatus.OK))
      .body as ManagerListBody;
    expect(all.total).toBe(counts.all);
  });

  it.each([
    [{ status: 'active' }],
    [{ page: 1 }],
    [{ sort: 'price:asc' }],
    [{ payment: 'unknown' }],
  ])('should refuse %j with 400', async (query) => {
    await getManagerCounts(app, manager, query).expect(HttpStatus.BAD_REQUEST);
  });
});
