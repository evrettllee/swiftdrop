import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { describeError } from '@/common/utils/describe-error';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders, payments } from '@/database/schema';
import { PENDING_PAYMENT_OUTCOME } from '../constants/payments.constants';
import type { ReconciliationSummary } from '../types/payments.types';
import { PaymentCancellationService } from './payment-cancellation.service';

// Settles the payments left pending on cancelled orders by the state of their sessions, with the
// same rules as the cancellation. It never charges: a session is only closed, a payment is only
// marked failed, or marked paid and refunded.
@Injectable()
export class PaymentReconciliationService {
  private readonly logger = new Logger(PaymentReconciliationService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly cancellation: PaymentCancellationService,
  ) {}

  async reconcileCancelledOrders(): Promise<ReconciliationSummary> {
    const cancelled = await this.db
      .selectDistinct({ orderId: payments.orderId })
      .from(payments)
      .innerJoin(orders, eq(orders.orderId, payments.orderId))
      .where(
        and(eq(payments.status, PAYMENT_STATUS.PENDING), eq(orders.status, ORDER_STATUS.CANCELLED)),
      )
      .orderBy(asc(payments.orderId));
    const summary: ReconciliationSummary = {
      orderCount: cancelled.length,
      failedOrderCount: 0,
      outcomes: {
        [PENDING_PAYMENT_OUTCOME.FAILED]: 0,
        [PENDING_PAYMENT_OUTCOME.REFUNDED]: 0,
        [PENDING_PAYMENT_OUTCOME.LEFT_PENDING]: 0,
      },
    };

    // One failing order must not stop the others, so its error only goes to the log.
    for (const { orderId } of cancelled) {
      try {
        for (const outcome of await this.cancellation.releasePendingPayments(orderId)) {
          summary.outcomes[outcome] += 1;
        }
      } catch (error) {
        summary.failedOrderCount += 1;
        this.logger.error(
          `Payments of order ${orderId} were not reconciled: ${describeError(error)}`,
        );
      }
    }

    return summary;
  }
}
