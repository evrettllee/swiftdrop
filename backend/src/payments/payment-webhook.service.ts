import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../common/constants/database';
import { ORDER_STATUS } from '../common/enums/order-status.enum';
import { PAYMENT_STATUS } from '../common/enums/payment-status.enum';
import { DRIZZLE } from '../database/database.constants';
import type { Database } from '../database/database.module';
import { orders, orderStatusHistory, payments } from '../db/schema';
import { PaymentGateway } from './payment.gateway';
import { PaymentRefundService } from './payment-refund.service';
import { PAYMENT_EVENT, PAYMENTS_ERROR_MESSAGES } from './payments.constants';
import type { ExpiredEvent, PaidEvent } from './payments.types';

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly gateway: PaymentGateway,
    private readonly refunds: PaymentRefundService,
  ) {}

  async process(rawBody: Buffer | undefined, signature: string | undefined): Promise<void> {
    if (!rawBody || !signature) {
      throw new BadRequestException(PAYMENTS_ERROR_MESSAGES.INVALID_SIGNATURE);
    }

    const event = this.gateway.parseWebhook(rawBody, signature);

    if (event?.type === PAYMENT_EVENT.PAID) {
      await this.settlePaid(event);
    } else if (event?.type === PAYMENT_EVENT.EXPIRED) {
      await this.failExpired(event);
    }
  }

  // Every step is safe to repeat, because the payment system resends an event until it gets a success.
  private async settlePaid(event: PaidEvent): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [payment] = await tx
        .update(payments)
        .set({ status: PAYMENT_STATUS.PAID, stripePaymentId: event.paymentRef })
        .where(
          and(
            eq(payments.checkoutSessionId, event.sessionId),
            inArray(payments.status, [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED]),
          ),
        )
        .returning({ orderId: payments.orderId });

      if (payment) {
        const [confirmed] = await tx
          .update(orders)
          .set({ status: ORDER_STATUS.CONFIRMED })
          .where(and(eq(orders.orderId, payment.orderId), eq(orders.status, ORDER_STATUS.PENDING)))
          .returning({ orderId: orders.orderId });

        if (confirmed) {
          await tx
            .insert(orderStatusHistory)
            .values({
              orderId: confirmed.orderId,
              status: ORDER_STATUS.CONFIRMED,
              changedBy: null,
            });
          this.logger.log(`Order ${confirmed.orderId} confirmed by payment`);
        }
      }
    });

    await this.refundIfOrderCancelled(event.sessionId);
  }

  // Money that arrived for a cancelled order goes back to the client.
  private async refundIfOrderCancelled(sessionId: string): Promise<void> {
    const [row] = await this.db
      .select({
        paymentId: payments.paymentId,
        paymentStatus: payments.status,
        orderStatus: orders.status,
      })
      .from(payments)
      .innerJoin(orders, eq(orders.orderId, payments.orderId))
      .where(eq(payments.checkoutSessionId, sessionId))
      .limit(SINGLE_ROW_LIMIT);

    if (!row) {
      this.logger.warn(`Payment event for an unknown session ${sessionId}`);
    } else if (
      row.paymentStatus === PAYMENT_STATUS.PAID &&
      row.orderStatus === ORDER_STATUS.CANCELLED
    ) {
      this.logger.warn(`Payment ${row.paymentId} arrived for a cancelled order, refunding`);
      await this.refunds.refundPayment(row.paymentId);
    }
  }

  private async failExpired(event: ExpiredEvent): Promise<void> {
    await this.db
      .update(payments)
      .set({ status: PAYMENT_STATUS.FAILED })
      .where(
        and(
          eq(payments.checkoutSessionId, event.sessionId),
          eq(payments.status, PAYMENT_STATUS.PENDING),
        ),
      );
  }
}
