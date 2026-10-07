import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, eq, lt } from 'drizzle-orm';
import { ORDER_STATUS } from '../../common/enums/order-status.enum';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database.module';
import { orders, orderStatusHistory } from '../../db/schema';
import { PaymentCancellationService } from '../../payments/services/payment-cancellation.service';
import {
  UNPAID_ORDER_TTL_MS,
  UNPAID_ORDERS_BATCH_SIZE,
  UNPAID_ORDERS_CRON,
} from '../orders.constants';

@Injectable()
export class UnpaidOrdersService {
  private readonly logger = new Logger(UnpaidOrdersService.name);
  private isRunning = false;

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly paymentCancellation: PaymentCancellationService,
  ) {}

  @Cron(UNPAID_ORDERS_CRON)
  async runScheduled(): Promise<void> {
    if (!this.isRunning) {
      this.isRunning = true;

      try {
        await this.cancelExpired();
      } catch (error) {
        this.logger.error(
          `Cancelling unpaid orders failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        this.isRunning = false;
      }
    }
  }

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
        const [updated] = await tx
          .update(orders)
          .set({ status: ORDER_STATUS.CANCELLED })
          .where(and(eq(orders.orderId, orderId), eq(orders.status, ORDER_STATUS.PENDING)))
          .returning({ orderId: orders.orderId });

        if (updated) {
          await tx
            .insert(orderStatusHistory)
            .values({ orderId, status: ORDER_STATUS.CANCELLED, changedBy: null });
          await this.paymentCancellation.releaseOrderPayments(orderId);
        }

        return Boolean(updated);
      });
    } catch (error) {
      this.logger.error(
        `Order ${orderId} was not cancelled: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return isCancelled;
  }
}
