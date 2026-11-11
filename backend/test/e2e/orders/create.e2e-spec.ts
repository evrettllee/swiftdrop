import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { addresses, orders, orderStatusHistory, packages, roles, users } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ORDERS_ROUTES } from '@/modules/orders/constants/orders.constants';
import { PRICING_ERROR_MESSAGES } from '@/modules/pricing/constants/pricing.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import {
  MOSCOW,
  VALID_ORDER,
  VALID_ORDER_PRICE,
  VALID_ORDER_PRICE_TEXT,
} from '@test/support/fixtures';
import { postApi } from '@test/support/http';
import { postOrder } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

describe('Orders (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create', () => {
    it('should create a pending order with the calculated price when a client sends a valid order', async () => {
      const { cookies } = await registerUser(app);

      const response = await postOrder(app, cookies, VALID_ORDER).expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        orderId: expect.any(Number),
        status: ORDER_STATUS.PENDING,
        price: VALID_ORDER_PRICE,
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
        price: VALID_ORDER_PRICE_TEXT,
        distanceKm: 7.98,
      });
    });

    it('should store the address copies, the package and the first history record when an order is created', async () => {
      const { cookies } = await registerUser(app);

      const response = await postOrder(app, cookies, VALID_ORDER).expect(HttpStatus.CREATED);

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

      const response = await postOrder(app, cookies, { ...VALID_ORDER, price: 0.01 }).expect(
        HttpStatus.CREATED,
      );

      expect(response.body.price).toBe(VALID_ORDER_PRICE);
    });

    it('should return 401 when the request has no authentication', async () => {
      await postApi(app, ORDERS_ROUTES.BASE).send(VALID_ORDER).expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 when the user is not a client', async () => {
      const { cookies } = await registerUser(app);
      const [courierRole] = await db
        .select({ roleId: roles.roleId })
        .from(roles)
        .where(eq(roles.name, ROLE.COURIER));
      await db.update(users).set({ roleId: courierRole.roleId });

      await postOrder(app, cookies, VALID_ORDER).expect(HttpStatus.FORBIDDEN);
    });

    it('should return 400 with a field error when the house is empty', async () => {
      const { cookies } = await registerUser(app);

      const response = await postOrder(app, cookies, {
        ...VALID_ORDER,
        pickup: { ...VALID_ORDER.pickup, house: '' },
      }).expect(HttpStatus.BAD_REQUEST);

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
      }).expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.DELIVERY_OUT_OF_ZONE);
      expect(await db.select().from(orders)).toHaveLength(0);
      expect(await db.select().from(addresses)).toHaveLength(0);
    });
  });
});
