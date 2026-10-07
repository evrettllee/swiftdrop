import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../common/constants/database';
import { PAYMENT_STATUS } from '../common/enums/payment-status.enum';
import { DRIZZLE } from '../database/database.constants';
import type { Database } from '../database/database.module';
import { payments } from '../db/schema';
import { PaymentGateway } from './payment.gateway';
import { PAYMENTS_ERROR_MESSAGES } from './payments.constants';

@Injectable()
export class PaymentRefundService {
  private readonly logger = new Logger(PaymentRefundService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly gateway: PaymentGateway,
  ) {}

  // Returns the money of a paid payment, a payment in any other status is left alone,
  // so a repeated call is safe. The status changes only after the payment system confirmed the refund.
  async refundPayment(paymentId: number): Promise<boolean> {
    const [payment] = await this.db
      .select({ status: payments.status, paymentRef: payments.stripePaymentId })
      .from(payments)
      .where(eq(payments.paymentId, paymentId))
      .limit(SINGLE_ROW_LIMIT);
    let isRefunded = false;

    if (payment?.status === PAYMENT_STATUS.PAID) {
      if (!payment.paymentRef) {
        this.logger.error(`Paid payment ${paymentId} has no payment reference`);
        throw new InternalServerErrorException(PAYMENTS_ERROR_MESSAGES.REFUND_FAILED);
      }

      await this.gateway.refund(payment.paymentRef);
      await this.db
        .update(payments)
        .set({ status: PAYMENT_STATUS.REFUNDED })
        .where(and(eq(payments.paymentId, paymentId), eq(payments.status, PAYMENT_STATUS.PAID)));
      this.logger.log(`Payment ${paymentId} refunded`);
      isRefunded = true;
    }

    return isRefunded;
  }

  // Returns all paid payments of an order, the number of refunded payments is the result.
  async refundOrderPayments(orderId: number): Promise<number> {
    const paid = await this.db
      .select({ paymentId: payments.paymentId })
      .from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.status, PAYMENT_STATUS.PAID)));
    let refundedCount = 0;

    for (const { paymentId } of paid) {
      if (await this.refundPayment(paymentId)) {
        refundedCount += 1;
      }
    }

    return refundedCount;
  }
}
