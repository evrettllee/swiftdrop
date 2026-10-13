import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../../../common/constants/database.constants';
import { transitionOrderStatus } from '../../../common/database/order-status-transition';
import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import { PAYMENT_STATUS } from '../../../common/enums/payment-status.enum';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { orders, payments } from '../../../database/schema';
import { PaymentGateway } from '../contracts/payment-gateway.contract';
import { PaymentRefundService } from './payment-refund.service';
import { PaymentSettlementService } from './payment-settlement.service';
import {
  KEPT_PAID_PAYMENTS,
  PAYMENT_EVENT,
  PAYMENTS_ERROR_MESSAGES,
} from '../constants/payments.constants';
import type { PaidEvent } from '../types/payments.types';

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly gateway: PaymentGateway,
    private readonly refunds: PaymentRefundService,
    private readonly settlement: PaymentSettlementService,
  ) {}

  async process(rawBody: Buffer | undefined, signature: string | undefined): Promise<void> {
    if (!rawBody || !signature) {
      throw new BadRequestException(PAYMENTS_ERROR_MESSAGES.INVALID_SIGNATURE);
    }

    const event = this.gateway.parseWebhook(rawBody, signature);

    if (event?.type === PAYMENT_EVENT.PAID) {
      await this.settlePaid(event);
    } else if (event?.type === PAYMENT_EVENT.EXPIRED) {
      await this.settlement.markFailed(event.sessionId);
    }
  }

  // Every step is safe to repeat, because the payment system resends an event until it gets a success.
  private async settlePaid(event: PaidEvent): Promise<void> {
    await this.db.transaction(async (tx) => {
      const payment = await this.settlement.markPaid(event.sessionId, event.paymentRef, tx);

      if (payment) {
        const confirmed = await transitionOrderStatus(tx, {
          orderId: payment.orderId,
          from: ORDER_STATUS.PENDING,
          to: ORDER_STATUS.CONFIRMED,
          changedBy: null,
        });

        if (confirmed) {
          this.logger.log(`Order ${confirmed.orderId} confirmed by payment`);
        }
      }
    });

    await this.refundIfNotNeeded(event.sessionId);
  }

  // Money the order does not need goes back to the client: a payment for a cancelled order, and a
  // second payment of an order already paid. Of the paid payments of an order the earliest one is
  // kept, so a resent event makes the same choice; the refund itself has an idempotency key in the
  // payment system and changes only a paid payment, so it never happens twice.
  private async refundIfNotNeeded(sessionId: string): Promise<void> {
    const [row] = await this.db
      .select({
        paymentId: payments.paymentId,
        orderId: payments.orderId,
        paymentStatus: payments.status,
        orderStatus: orders.status,
      })
      .from(payments)
      .innerJoin(orders, eq(orders.orderId, payments.orderId))
      .where(eq(payments.checkoutSessionId, sessionId))
      .limit(SINGLE_ROW_LIMIT);

    if (!row) {
      this.logger.warn(`Payment event for an unknown session ${sessionId}`);
    } else if (row.paymentStatus === PAYMENT_STATUS.PAID) {
      if (row.orderStatus === ORDER_STATUS.CANCELLED) {
        this.logger.warn(`Payment ${row.paymentId} arrived for a cancelled order, refunding`);
        await this.refunds.refundPayment(row.paymentId);
      } else {
        await this.refundExtraPayments(row.orderId);
      }
    }
  }

  // Every paid payment of the order but the earliest one goes back.
  private async refundExtraPayments(orderId: number): Promise<void> {
    const paid = await this.db
      .select({ paymentId: payments.paymentId })
      .from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.status, PAYMENT_STATUS.PAID)))
      .orderBy(asc(payments.paymentId));

    for (const { paymentId } of paid.slice(KEPT_PAID_PAYMENTS)) {
      this.logger.warn(`Payment ${paymentId} is a second payment of order ${orderId}, refunding`);
      await this.refunds.refundPayment(paymentId);
    }
  }
}
