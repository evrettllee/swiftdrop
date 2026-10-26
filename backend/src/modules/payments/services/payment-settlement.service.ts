import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { payments } from '@/database/schema';

// The changes of a payment that follow its session in the payment system, shared by the webhook and
// the reconciliation of a cancelled order. Each change is safe to repeat: a payment already settled
// is left alone.
@Injectable()
export class PaymentSettlementService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // A payment closed as failed is marked paid too: the payment system confirmed the money.
  // Returns the order of the payment, or nothing when the payment was already settled.
  async markPaid(
    sessionId: string,
    paymentRef: string,
    executor: Database | Transaction = this.db,
  ): Promise<{ orderId: number } | undefined> {
    const [payment] = await executor
      .update(payments)
      .set({ status: PAYMENT_STATUS.PAID, stripePaymentId: paymentRef })
      .where(
        and(
          eq(payments.checkoutSessionId, sessionId),
          inArray(payments.status, [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED]),
        ),
      )
      .returning({ orderId: payments.orderId });

    return payment;
  }

  async markFailed(sessionId: string): Promise<void> {
    await this.db
      .update(payments)
      .set({ status: PAYMENT_STATUS.FAILED })
      .where(
        and(eq(payments.checkoutSessionId, sessionId), eq(payments.status, PAYMENT_STATUS.PENDING)),
      );
  }
}
