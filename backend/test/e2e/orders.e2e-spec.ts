import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '../../src/common/enums/order-status.enum';
import { ROLE } from '../../src/common/enums/role.enum';
import { DRIZZLE } from '../../src/database/database.constants';
import type { Database } from '../../src/database/database.module';
import { addresses, orders, orderStatusHistory, packages, roles, users } from '../../src/db/schema';
import { OsrmService } from '../../src/integrations/osrm/osrm.service';
import { ORDERS_ROUTES } from '../../src/orders/orders.constants';
import { PRICING_ERROR_MESSAGES } from '../../src/pricing/pricing.constants';
import { createTestApp } from '../support/app';
import { registerUser } from '../support/auth';
import { resetTestData, seedServiceArea } from '../support/database';
import { MOSCOW, ROUTE, VALID_ORDER } from '../support/fixtures';
import { postApi } from '../support/http';
import { postOrder } from '../support/orders';

describe('Orders (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    await seedServiceArea(db);
    getRoute.mockReset();
    getRoute.mockResolvedValue(ROUTE);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create', () => {
    it('should create a pending order with the calculated price when a client sends a valid order', async () => {
      const { cookies } = await registerUser(app);

      const response = await postOrder(app, cookies, VALID_ORDER).expect(201);

      expect(response.body).toEqual({
        orderId: expect.any(Number),
        status: ORDER_STATUS.PENDING,
        price: 9.23,
        currency: 'BYN',
        estimatedDeliveryAt: expect.any(String),
      });

      const [order] = await db.select().from(orders);
      const [client] = await db.select({ userId: users.userId }).from(users);

      expect(order).toMatchObject({
        orderId: response.body.orderId,
        clientId: client.userId,
        status: ORDER_STATUS.PENDING,
        recipientName: 'Ирина Козлова',
        recipientPhone: '+375291234567',
        price: '9.23',
        distanceKm: 7.98,
      });
    });

    it('should store the address copies, the package and the first history record when an order is created', async () => {
      const { cookies } = await registerUser(app);

      const response = await postOrder(app, cookies, VALID_ORDER).expect(201);

      const addressRows = await db.select().from(addresses);
      const [parcel] = await db.select().from(packages);
      const [history] = await db.select().from(orderStatusHistory);
      const [client] = await db.select({ userId: users.userId }).from(users);

      expect(addressRows).toHaveLength(2);
      expect(addressRows.every((row) => row.userId === null)).toBe(true);
      expect(addressRows.map((row) => row.apartment)).toEqual(expect.arrayContaining(['47', null]));
      expect(parcel).toMatchObject({
        orderId: response.body.orderId,
        weight: 2.5,
        isFragile: false,
      });
      expect(history).toMatchObject({
        orderId: response.body.orderId,
        status: ORDER_STATUS.PENDING,
        changedBy: client.userId,
      });
    });

    it('should ignore the price from the request when a client sends its own', async () => {
      const { cookies } = await registerUser(app);

      const response = await postOrder(app, cookies, { ...VALID_ORDER, price: 0.01 }).expect(201);

      expect(response.body.price).toBe(9.23);
    });

    it('should return 401 when the request has no authentication', async () => {
      await postApi(app, ORDERS_ROUTES.BASE).send(VALID_ORDER).expect(401);
    });

    it('should return 403 when the user is not a client', async () => {
      const { cookies } = await registerUser(app);
      const [courierRole] = await db
        .select({ roleId: roles.roleId })
        .from(roles)
        .where(eq(roles.name, ROLE.COURIER));
      await db.update(users).set({ roleId: courierRole.roleId });

      await postOrder(app, cookies, VALID_ORDER).expect(403);
    });

    it('should return 400 with a field error when the house is empty', async () => {
      const { cookies } = await registerUser(app);

      const response = await postOrder(app, cookies, {
        ...VALID_ORDER,
        pickup: { ...VALID_ORDER.pickup, house: '' },
      }).expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: expect.stringContaining('house') }),
        ]),
      );
    });

    it('should return 422 and save nothing when the delivery is outside every zone', async () => {
      const { cookies } = await registerUser(app);

      const response = await postOrder(app, cookies, {
        ...VALID_ORDER,
        delivery: { ...VALID_ORDER.delivery, ...MOSCOW },
      }).expect(422);

      expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.DELIVERY_OUT_OF_ZONE);
      expect(await db.select().from(orders)).toHaveLength(0);
      expect(await db.select().from(addresses)).toHaveLength(0);
    });
  });
});
