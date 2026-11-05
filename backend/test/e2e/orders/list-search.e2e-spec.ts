import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { addresses, orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { addCourierSession } from '@test/support/assignment';
import { registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { getOrders, placeOrders, SECOND_CLIENT } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

type ListBody = {
  items: { orderId: number; courier: { name: string } | null }[];
  total: number;
  nextCursor?: string | null;
};

function idsOf(body: ListBody): number[] {
  return body.items.map((item) => item.orderId);
}

describe('Orders list search (e2e)', () => {
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

  async function moveDelivery(orderId: number, street: string, house: string): Promise<void> {
    const [order] = await db
      .select({ addressId: orders.deliveryAddressId })
      .from(orders)
      .where(eq(orders.orderId, orderId));
    await db
      .update(addresses)
      .set({ street, house })
      .where(eq(addresses.addressId, order.addressId));
  }

  it('should find an order by its number exactly', async () => {
    const { cookies } = await registerUser(app);
    const [first, second] = await placeOrders(app, cookies, 2);

    const response = await getOrders(app, cookies, { q: String(second) }).expect(HttpStatus.OK);

    expect(idsOf(response.body)).toEqual([second]);
    expect(response.body.total).toBe(1);
    expect(idsOf(response.body)).not.toContain(first);
  });

  it('should find orders by the street and the house of the delivery or the pickup', async () => {
    const { cookies } = await registerUser(app);
    const [nemiga, other] = await placeOrders(app, cookies, 2);
    await moveDelivery(nemiga, 'ул. Немига', '5');

    const byDelivery = await getOrders(app, cookies, { q: 'немига, 5' }).expect(HttpStatus.OK);
    const byPickup = await getOrders(app, cookies, { q: 'Свердлова 13а' }).expect(HttpStatus.OK);

    expect(idsOf(byDelivery.body)).toEqual([nemiga]);
    expect(byDelivery.body.total).toBe(1);
    expect(idsOf(byPickup.body)).toEqual([other, nemiga]);
  });

  it('should not find the order of another client by its number or its street', async () => {
    const { cookies } = await registerUser(app);
    const { cookies: otherCookies } = await registerUser(app, SECOND_CLIENT);
    await placeOrders(app, cookies, 1);
    const [foreign] = await placeOrders(app, otherCookies, 1);
    await moveDelivery(foreign, 'ул. Немига', '5');

    const byNumber = await getOrders(app, cookies, { q: String(foreign) }).expect(HttpStatus.OK);
    const byStreet = await getOrders(app, cookies, { q: 'Немига' }).expect(HttpStatus.OK);

    expect(byNumber.body).toMatchObject({ items: [], total: 0 });
    expect(byStreet.body).toMatchObject({ items: [], total: 0 });
  });

  it('should search in the cursor mode and count the found orders there', async () => {
    const { cookies } = await registerUser(app);
    const [first, second, third] = await placeOrders(app, cookies, 3);
    await moveDelivery(third, 'ул. Немига', '5');

    const firstPage = await getOrders(app, cookies, {
      q: 'Притыцкого',
      cursor: '',
      limit: 1,
    }).expect(HttpStatus.OK);
    const nextPage = await getOrders(app, cookies, {
      q: 'Притыцкого',
      cursor: firstPage.body.nextCursor,
      limit: 1,
    }).expect(HttpStatus.OK);

    expect(firstPage.body.total).toBe(2);
    expect(idsOf(firstPage.body)).toEqual([second]);
    expect(idsOf(nextPage.body)).toEqual([first]);
    expect(nextPage.body.nextCursor).toBeNull();
  });

  it('should name the courier by the first name and the initial only', async () => {
    const { cookies } = await registerUser(app);
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const [delivered, waiting] = await placeOrders(app, cookies, 2);
    await assignOrder(db, delivered, courier.courierProfileId, ORDER_STATUS.DELIVERED);

    const response = await getOrders(app, cookies).expect(HttpStatus.OK);
    const byId = new Map(
      (response.body as ListBody).items.map((item) => [item.orderId, item.courier]),
    );

    expect(byId.get(delivered)).toEqual({ name: 'Дмитрий С.' });
    expect(byId.get(waiting)).toBeNull();
    expect(JSON.stringify(response.body)).not.toContain(COURIER_ACCOUNT.lastName);
  });
});
