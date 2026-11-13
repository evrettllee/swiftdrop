import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId, getAdminUser } from '@test/support/admin';
import { addCourierSession } from '@test/support/assignment';
import { registerUser, validRegistration } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { createManager } from '@test/support/manager';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { MANAGER_ACCOUNT } from '@test/support/users';

const ORDERS_PLACED = 6;
const RECENT = 5;

describe('Admin user card with orders (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let orderIds: number[];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    admin = await createAdmin(app, db);
    const { cookies } = await registerUser(app);
    orderIds = await placeOrders(app, cookies, ORDERS_PLACED);
  });

  afterAll(async () => {
    await app.close();
  });

  async function card(email: string) {
    const response = await getAdminUser(app, admin, await findUserId(db, email)).expect(
      HttpStatus.OK,
    );

    return response.body;
  }

  it('should count the orders of a client and give the five newest with prices', async () => {
    await setOrderStatus(db, orderIds[0], ORDER_STATUS.DELIVERED);
    await setOrderStatus(db, orderIds[1], ORDER_STATUS.CANCELLED);

    const body = await card(validRegistration.email);

    expect(body).toMatchObject({
      role: ROLE.CLIENT,
      status: 'active',
      login: { password: true, google: false, yandex: false },
      courier: null,
      block: null,
      invite: null,
      deletion: null,
      history: [],
    });
    expect(body.orders).toMatchObject({ total: ORDERS_PLACED, delivered: 1, cancelled: 1 });
    expect(body.orders.recent.map((order: { orderId: number }) => order.orderId)).toEqual(
      [...orderIds].reverse().slice(0, RECENT),
    );
    expect(body.orders.recent[0]).toMatchObject({
      from: 'ул. Свердлова, 13а',
      to: 'пр-т Притыцкого, 83',
      price: expect.any(Number),
    });
    expect(JSON.stringify(body)).not.toMatch(/passwordHash|argon2|providerUserId/);
  });

  it('should give the vehicle, the deliveries and the active order of a courier without prices', async () => {
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await assignOrder(db, orderIds[0], courier.courierProfileId, ORDER_STATUS.DELIVERED);
    await assignOrder(db, orderIds[1], courier.courierProfileId, ORDER_STATUS.CANCELLED);
    await assignOrder(db, orderIds[2], courier.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);

    const body = await card(COURIER_ACCOUNT.email);

    expect(body.courier).toEqual({
      vehicleType: CAR.type,
      deliveredCount: 1,
      cancelledCount: 1,
      isAvailable: true,
      activeOrderId: orderIds[2],
    });
    expect(body.orders).toMatchObject({ total: 3, delivered: 1, cancelled: 1 });
    expect(body.orders.recent.map((order: { price: unknown }) => order.price)).toEqual([
      null,
      null,
      null,
    ]);
  });

  it('should give a manager no orders', async () => {
    await createManager(app, db);

    const body = await card(MANAGER_ACCOUNT.email);

    expect(body).toMatchObject({ role: ROLE.MANAGER, courier: null });
    expect(body.orders).toEqual({ total: 0, delivered: 0, cancelled: 0, recent: [] });
  });
});
