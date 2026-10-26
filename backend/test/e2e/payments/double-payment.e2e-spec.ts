import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { payments } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { PAYMENT_EVENT } from '@/modules/payments/constants/payments.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { placeOrders, readOrderStatus } from '@test/support/orders';
import {
  createGatewayMock,
  insertPayment,
  postWebhook,
  readPaymentStatus,
  resetGatewayMock,
  WEBHOOK_SIGNATURE,
} from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

const EARLIER_PAYMENT_REF = 'pi_test_earlier';
const LATER_PAYMENT_REF = 'pi_test_later';

describe('Two paid payments of one order (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    resetGatewayMock(gateway);

    const { cookies } = await registerUser(app);
    [orderId] = await placeOrders(app, cookies, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  // Two attempts of the order, both paid in Stripe: the earlier one was closed (failed) but its
  // page was still open. The events come in the given order of the attempts.
  async function payBothAttempts(
    eventOrder: 'earlier-first' | 'later-first',
  ): Promise<{ earlierId: number; laterId: number }> {
    const earlierId = await insertPayment(db, orderId, { status: PAYMENT_STATUS.FAILED });
    const laterId = await insertPayment(db, orderId);
    const [earlier, later] = await db
      .select({ sessionId: payments.checkoutSessionId })
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(payments.paymentId);
    const events = [
      { sessionId: earlier.sessionId, paymentRef: EARLIER_PAYMENT_REF },
      { sessionId: later.sessionId, paymentRef: LATER_PAYMENT_REF },
    ];

    if (eventOrder === 'later-first') {
      events.reverse();
    }

    for (const event of events) {
      gateway.parseWebhook.mockReturnValueOnce({ type: PAYMENT_EVENT.PAID, orderId, ...event });
      await postWebhook(app, WEBHOOK_SIGNATURE).expect(HttpStatus.OK);
    }

    return { earlierId, laterId };
  }

  it.each(['earlier-first', 'later-first'] as const)(
    'should keep the earliest payment and refund the other one when both are paid (%s)',
    async (eventOrder) => {
      const { earlierId, laterId } = await payBothAttempts(eventOrder);

      expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
      expect(await readPaymentStatus(db, earlierId)).toBe(PAYMENT_STATUS.PAID);
      expect(await readPaymentStatus(db, laterId)).toBe(PAYMENT_STATUS.REFUNDED);
      expect(gateway.refund).toHaveBeenCalledTimes(1);
      expect(gateway.refund).toHaveBeenCalledWith(LATER_PAYMENT_REF);
    },
  );

  it('should not refund again when the event of the second payment comes again', async () => {
    const { laterId } = await payBothAttempts('earlier-first');
    const [later] = await db
      .select({ sessionId: payments.checkoutSessionId })
      .from(payments)
      .where(eq(payments.paymentId, laterId));
    gateway.parseWebhook.mockReturnValueOnce({
      type: PAYMENT_EVENT.PAID,
      orderId,
      sessionId: later.sessionId,
      paymentRef: LATER_PAYMENT_REF,
    });

    await postWebhook(app, WEBHOOK_SIGNATURE).expect(HttpStatus.OK);

    expect(gateway.refund).toHaveBeenCalledTimes(1);
    expect(await readPaymentStatus(db, laterId)).toBe(PAYMENT_STATUS.REFUNDED);
  });
});
