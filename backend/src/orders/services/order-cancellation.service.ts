import {
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../../common/constants/database.constants';
import { isLockTimeout } from '../../common/database/pg-errors';
import { ORDER_STATUS, type OrderStatus } from '../../common/enums/order-status.enum';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database.module';
import { orders, orderStatusHistory } from '../../db/schema';
import { PaymentCancellationService } from '../../payments/services/payment-cancellation.service';
import { CANCELLABLE_STATUSES, FINISHED_STATUSES, ORDERS_ERROR_MESSAGES } from '../orders.constants';
import type { CancelledOrder } from '../orders.types';

// The order the cancellation changed, or nothing when its status did not allow it.
type CancelledRow = { orderId: number } | undefined;

@Injectable()
export class OrderCancellationService {
  private readonly logger = new Logger(OrderCancellationService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly paymentCancellation: PaymentCancellationService,
  ) {}

  async cancel(clientId: number, orderId: number): Promise<CancelledOrder> {
    const cancelled = await this.cancelInTransaction(clientId, orderId);

    if (!cancelled) {
      throw await this.explainRefusal(clientId, orderId);
    }

    this.logger.log(`Order ${orderId} cancelled by client ${clientId}`);

    return { orderId, status: ORDER_STATUS.CANCELLED };
  }

  // The order row may be held by a payment being started or settled: after the lock timeout the
  // client is told to try again, nothing has changed.
  private async cancelInTransaction(clientId: number, orderId: number): Promise<CancelledRow> {
    try {
      return await this.runCancellation(clientId, orderId);
    } catch (error) {
      if (isLockTimeout(error)) {
        this.logger.warn(`Order ${orderId} is busy, its cancellation is refused for now`);
        throw new ConflictException(ORDERS_ERROR_MESSAGES.BUSY);
      }

      throw error;
    }
  }

  private runCancellation(clientId: number, orderId: number): Promise<CancelledRow> {
    return this.db.transaction(async (tx) => {
      // The status check is part of the update, so a pickup that happens in between is never overwritten.
      const [updated] = await tx
        .update(orders)
        .set({ status: ORDER_STATUS.CANCELLED })
        .where(
          and(
            eq(orders.orderId, orderId),
            eq(orders.clientId, clientId),
            inArray(orders.status, [...CANCELLABLE_STATUSES]),
          ),
        )
        .returning({ orderId: orders.orderId });

      if (updated) {
        await tx
          .insert(orderStatusHistory)
          .values({ orderId, status: ORDER_STATUS.CANCELLED, changedBy: clientId });
        // A failed refund throws and rolls the cancellation back, so the client can simply try again.
        await this.paymentCancellation.releaseOrderPayments(orderId);
      }

      return updated;
    });
  }

  // A foreign order looks the same as a missing one, so ids cannot be probed.
  private async explainRefusal(clientId: number, orderId: number): Promise<HttpException> {
    const [order] = await this.db
      .select({ status: orders.status })
      .from(orders)
      .where(and(eq(orders.orderId, orderId), eq(orders.clientId, clientId)))
      .limit(SINGLE_ROW_LIMIT);

    let error: HttpException = new NotFoundException(ORDERS_ERROR_MESSAGES.NOT_FOUND);

    if (order) {
      const isFinished = new Set<OrderStatus>(FINISHED_STATUSES).has(order.status);

      error = new ConflictException(
        isFinished ? ORDERS_ERROR_MESSAGES.ALREADY_FINISHED : ORDERS_ERROR_MESSAGES.CANNOT_CANCEL,
      );
    }

    return error;
  }
}
