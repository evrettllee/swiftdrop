import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { insertBareCouriers, insertOffer, recordConfirmation } from '@test/support/assignment';
import { createTestApp } from '@test/support/app';
import { registerUser, validRegistration } from '@test/support/auth';
import {
  assignOrder,
  CAR,
  COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  putVehicle,
} from '@test/support/couriers';
import { VALID_ORDER, VALID_ORDER_PRICE } from '@test/support/fixtures';
import { createManager, getManagerOrder, insertOrderTicket } from '@test/support/manager';
import { placeOrders } from '@test/support/orders';
import { insertPayment } from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

const EARLIER = new Date(Date.now() - 120_000);
const LATER = new Date(Date.now() - 60_000);

describe('Manager order details (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let courier: string;
  let client: string;
  let orderId: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: client } = await registerUser(app));
    [orderId] = await placeOrders(app, client, 1);
    manager = await createManager(app, db);
    courier = await createCourier(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refuse a client and a courier', async () => {
    await getManagerOrder(app, client, orderId).expect(HttpStatus.FORBIDDEN);
    await getManagerOrder(app, courier, orderId).expect(HttpStatus.FORBIDDEN);
  });

  it('should answer 404 for a missing order and 400 for a wrong id', async () => {
    await getManagerOrder(app, manager, orderId + 1000).expect(HttpStatus.NOT_FOUND);
    await getManagerOrder(app, manager, 0).expect(HttpStatus.BAD_REQUEST);
  });

  it('should give the whole order with the offers of two rounds and the ticket', async () => {
    await putVehicle(app, courier, CAR).expect(HttpStatus.OK);
    const courierId = await findCourierProfileId(db, COURIER_ACCOUNT.email);
    const [declinedId] = await insertBareCouriers(db, 1);
    await recordConfirmation(db, orderId, new Date());
    await insertOffer(db, orderId, declinedId, {
      status: ORDER_OFFER_STATUS.EXPIRED,
      offeredAt: EARLIER,
    });
    await insertOffer(db, orderId, courierId, {
      round: 2,
      status: ORDER_OFFER_STATUS.ACCEPTED,
      offeredAt: LATER,
      respondedAt: LATER,
    });
    await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);
    await insertPayment(db, orderId, { status: PAYMENT_STATUS.PAID });
    const [{ clientId }] = await db
      .select({ clientId: orders.clientId })
      .from(orders)
      .where(eq(orders.orderId, orderId));
    const ticketId = await insertOrderTicket(db, orderId, clientId);

    const response = await getManagerOrder(app, manager, orderId).expect(HttpStatus.OK);
    const body = response.body as Record<string, unknown>;

    expect(body).toMatchObject({
      id: orderId,
      status: ORDER_STATUS.COURIER_ASSIGNED,
      finishedAt: null,
      client: {
        id: clientId,
        name: `${validRegistration.firstName} ${validRegistration.lastName}`,
        phone: validRegistration.phone,
        email: validRegistration.email,
      },
      courier: {
        id: courierId,
        name: `${COURIER_ACCOUNT.firstName} ${COURIER_ACCOUNT.lastName}`,
        phone: COURIER_ACCOUNT.phone,
        vehicle: { type: CAR.type, brand: CAR.brand, model: CAR.model, plate: CAR.licensePlate },
      },
      recipient: { name: VALID_ORDER.recipient.name, phone: '+375291234567' },
      route: {
        from: { street: VALID_ORDER.pickup.street, house: VALID_ORDER.pickup.house },
        to: { street: VALID_ORDER.delivery.street, house: VALID_ORDER.delivery.house },
      },
      parcel: { weight: 2.5, length: 30, width: 20, height: 10, fragile: false },
      pricing: { price: VALID_ORDER_PRICE },
      payment: { state: 'paid', refundedAt: null },
      history: [
        { status: ORDER_STATUS.PENDING, actor: 'client', comment: null },
        { status: ORDER_STATUS.CONFIRMED, actor: 'system', comment: null },
      ],
      offers: [
        { round: 1, courier: { id: declinedId, vehicleType: null }, status: 'expired' },
        {
          round: 2,
          courier: { id: courierId, vehicleType: CAR.type },
          status: 'accepted',
          respondedAt: LATER.toISOString(),
        },
      ],
      tickets: [{ id: ticketId, topic: 'order_problem', status: 'open', author: 'client' }],
      actions: {
        canAssign: false,
        canReassign: true,
        canRestartAutoAssign: true,
        canCancel: true,
      },
    });
    expect(typeof (body.payment as Record<string, unknown>).paidAt).toBe('string');
    expect(JSON.stringify(body)).not.toMatch(/passwordHash|otpCode|changedBy|userId|Token/);
  });

  it('should allow assignment and a restart while the order waits for a manager', async () => {
    await db
      .update(orders)
      .set({ status: ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT })
      .where(eq(orders.orderId, orderId));

    const response = await getManagerOrder(app, manager, orderId).expect(HttpStatus.OK);

    expect(response.body).toMatchObject({
      courier: null,
      payment: { state: 'unpaid', paidAt: null, refundedAt: null },
      offers: [],
      tickets: [],
      actions: { canAssign: true, canReassign: false, canRestartAutoAssign: true, canCancel: true },
    });
  });
});
