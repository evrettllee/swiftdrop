import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { packages } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { registerUser, validRegistration } from '@test/support/auth';
import {
  assignOrder,
  COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
} from '@test/support/couriers';
import {
  createManager,
  getManagerOrders,
  idsOf,
  type ManagerListBody,
} from '@test/support/manager';
import { placeOrders, SECOND_CLIENT } from '@test/support/orders';
import { insertPayment } from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

describe('Manager orders search and filters (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let firstIds: number[];
  let secondIds: number[];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const first = await registerUser(app);
    const second = await registerUser(app, SECOND_CLIENT);
    firstIds = await placeOrders(app, first.cookies, 3);
    secondIds = await placeOrders(app, second.cookies, 2);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function list(query: Record<string, string | number> = {}): Promise<ManagerListBody> {
    const response = await getManagerOrders(app, manager, query).expect(HttpStatus.OK);

    return response.body as ManagerListBody;
  }

  it('should find an order by its number', async () => {
    expect(idsOf(await list({ q: String(firstIds[1]) }))).toEqual([firstIds[1]]);
  });

  it('should find the orders of a client by a phone typed with spaces and dashes', async () => {
    expect(idsOf(await list({ q: '+375 29 765-43-21' }))).toEqual([...secondIds].reverse());
  });

  it('should find the orders by the phone of the recipient', async () => {
    expect(idsOf(await list({ q: '375291234567' }))).toEqual([...firstIds, ...secondIds].reverse());
  });

  it('should find the orders of a client by a part of the email', async () => {
    expect(idsOf(await list({ q: 'anna@exam' }))).toEqual([...secondIds].reverse());
  });

  it('should find the orders by a part of the full name of the client', async () => {
    const all = [...firstIds, ...secondIds].reverse();

    expect(idsOf(await list({ q: `${validRegistration.firstName} Петр` }))).toEqual(all);
  });

  it('should find the orders by the name of the recipient', async () => {
    expect(idsOf(await list({ q: 'козлова' }))).toEqual([...firstIds, ...secondIds].reverse());
  });

  it('should find the orders of a client by a local Belarusian number', async () => {
    expect(idsOf(await list({ q: '8 029 765-43-21' }))).toEqual([...secondIds].reverse());
  });

  it('should take % and _ of the search as plain characters', async () => {
    expect(idsOf(await list({ q: '%%%' }))).toEqual([]);
    expect(idsOf(await list({ q: '___' }))).toEqual([]);
  });

  it('should refuse a text search shorter than three characters', async () => {
    const response = await getManagerOrders(app, manager, { q: 'Ив' }).expect(
      HttpStatus.BAD_REQUEST,
    );

    expect(JSON.stringify(response.body)).toContain('Введите не меньше 3 символов');
  });

  it('should filter by the courier, the payment and fragile parcels', async () => {
    await createCourier(app, db);
    const courierId = await findCourierProfileId(db, COURIER_ACCOUNT.email);
    await assignOrder(db, firstIds[0], courierId, ORDER_STATUS.COURIER_ASSIGNED);
    await insertPayment(db, firstIds[0], { status: PAYMENT_STATUS.PAID });
    await insertPayment(db, firstIds[1], { status: PAYMENT_STATUS.REFUNDED });
    await db.update(packages).set({ isFragile: true }).where(eq(packages.orderId, secondIds[0]));

    expect(idsOf(await list({ courierId }))).toEqual([firstIds[0]]);
    expect(idsOf(await list({ payment: 'paid' }))).toEqual([firstIds[0]]);
    expect(idsOf(await list({ payment: 'refunded' }))).toEqual([firstIds[1]]);
    expect(idsOf(await list({ payment: 'unpaid' }))).toEqual([
      secondIds[1],
      secondIds[0],
      firstIds[2],
    ]);
    expect(idsOf(await list({ fragile: 'true' }))).toEqual([secondIds[0]]);
  });

  it('should give the phones in full and no other field of the user', async () => {
    const [item] = (await list({ q: String(firstIds[0]) })).items as unknown as Record<
      string,
      Record<string, unknown>
    >[];

    expect(item.client).toEqual({ name: 'Иван Петров', phone: '+375291234567' });
    expect(JSON.stringify(item)).not.toContain('@example.com');
  });
});
