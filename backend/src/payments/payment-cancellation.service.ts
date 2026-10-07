import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { PAYMENT_STATUS } from '../common/enums/payment-status.enum';
import { DRIZZLE } from '../database/database.constants';
import type { Database } from '../database/database.module';
import { payments } from '../db/schema';
import { PaymentGateway } from './payment.gateway';
import { PaymentRefundService } from './payment-refund.service';

@Injectable()
export class PaymentCancellationService {
  private readonly logger = new Logger(PaymentCancellationService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly gateway: PaymentGateway,
    private readonly refunds: PaymentRefundService,
  ) {}

  // Called when an order is cancelled: the unpaid sessions are closed and the paid money goes back.
  async releaseOrderPayments(orderId: number): Promise<void> {
    await this.expirePendingSessions(orderId);
    await this.refunds.refundOrderPayments(orderId);
  }

  // A session that cannot be closed stays pending: if it gets paid, the webhook refunds the money,
  // because the order is already cancelled.
  private async expirePendingSessions(orderId: number): Promise<void> {
    const pending = await this.db
      .select({
        paymentId: payments.paymentId,
        checkoutSessionId: payments.checkoutSessionId,
      })
      .from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.status, PAYMENT_STATUS.PENDING)));

    for (const { paymentId, checkoutSessionId } of pending) {
      try {
        await this.gateway.expireCheckoutSession(checkoutSessionId);
        await this.db
          .update(payments)
          .set({ status: PAYMENT_STATUS.FAILED })
          .where(
            and(eq(payments.paymentId, paymentId), eq(payments.status, PAYMENT_STATUS.PENDING)),
          );
      } catch {
        this.logger.warn(
          `Session of payment ${paymentId} was not closed, the webhook will settle it`,
        );
      }
    }
  }
}
