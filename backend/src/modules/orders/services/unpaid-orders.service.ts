import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, lt } from 'drizzle-orm';
import { transitionOrderStatus } from '../../../common/database/order-status-transition';
import { isLockTimeout } from '../../../common/database/pg-errors';
import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import { describeError } from '../../../common/utils/describe-error';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { orders } from '../../../database/schema';
import { PaymentCancellationService } from '../../payments/services/payment-cancellation.service';
import { UNPAID_ORDER_TTL_MS, UNPAID_ORDERS_BATCH_SIZE } from '../constants/orders.constants';

@Injectable()
export class UnpaidOrdersService {
  private readonly logger = new Logger(UnpaidOrdersService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly paymentCancellation: PaymentCancellationService,
  ) {}

  // Cancels the orders that stayed unpaid longer than the allowed time, returns how many were cancelled.
  async cancelExpired(now: Date = new Date()): Promise<number> {
    const deadline = new Date(now.getTime() - UNPAID_ORDER_TTL_MS);
    const expired = await this.db
      .select({ orderId: orders.orderId })
      .from(orders)
      .where(and(eq(orders.status, ORDER_STATUS.PENDING), lt(orders.createdAt, deadline)))
      .orderBy(orders.createdAt)
      .limit(UNPAID_ORDERS_BATCH_SIZE);
    let cancelledCount = 0;

    for (const { orderId } of expired) {
      if (await this.cancelOne(orderId)) {
        cancelledCount += 1;
      }
    }

    if (cancelledCount > 0) {
      this.logger.log(`Cancelled ${cancelledCount} unpaid orders`);
    }

    return cancelledCount;
  }

  // One failing order must not stop the others, so its error only goes to the log.
  private async cancelOne(orderId: number): Promise<boolean> {
    let isCancelled = false;

    try {
      isCancelled = await this.db.transaction(async (tx) => {
        // The status check is part of the update, so an order paid at this moment is never cancelled.
        const updated = await transitionOrderStatus(tx, {
          orderId,
          from: ORDER_STATUS.PENDING,
          to: ORDER_STATUS.CANCELLED,
          changedBy: null,
        });

        if (updated) {
          await this.paymentCancellation.releaseOrderPayments(orderId);
        }

        return Boolean(updated);
      });
    } catch (error) {
      if (isLockTimeout(error)) {
        // Another operation holds the order (a payment being started or settled): nothing is
        // wrong, the order is looked at again on the next run.
        this.logger.warn(`Order ${orderId} is busy, it is left for the next run`);
      } else {
        this.logger.error(`Order ${orderId} was not cancelled: ${describeError(error)}`);
      }
    }

    return isCancelled;
  }
}
