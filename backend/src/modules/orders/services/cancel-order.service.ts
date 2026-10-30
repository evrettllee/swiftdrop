import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import {
  type OrderTransaction,
  transitionOrderStatus,
} from '@/common/database/order-status-transition';
import { isLockTimeout } from '@/common/database/pg-errors';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { describeError } from '@/common/utils/describe-error';
import { orderOffers, orders } from '@/database/schema';
import { PaymentCancellationService } from '@/modules/payments/services/payment-cancellation.service';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import { OrderTransactionsService } from '@/modules/tracking/services/order-transactions.service';
import { CANCELLABLE_STATUSES, ORDERS_ERROR_MESSAGES } from '../constants/orders.constants';
import type {
  CancelOrderOutcome,
  CancelOrderRequest,
  OrderCancellation,
} from '../types/order-cancel.types';

const ROW_LOCK_UPDATE = 'update';

@Injectable()
export class CancelOrderService {
  private readonly logger = new Logger(CancelOrderService.name);

  constructor(
    private readonly paymentCancellation: PaymentCancellationService,
    private readonly events: RealtimeEventsService,
    private readonly orderTransactions: OrderTransactionsService,
  ) {}

  async cancel(request: CancelOrderRequest): Promise<CancelOrderOutcome> {
    const outcome = await this.runLocked(request);

    if (outcome.cancelled) {
      this.announceSafely(request.orderId, outcome);
    }

    return outcome.cancelled
      ? { cancelled: true, refund: outcome.refund }
      : { cancelled: false, status: outcome.status };
  }

  private async runLocked(request: CancelOrderRequest): Promise<OrderCancellation> {
    try {
      return await this.orderTransactions.run((orderTx) =>
        this.cancelInTransaction(orderTx, request),
      );
    } catch (error) {
      if (isLockTimeout(error)) {
        this.logger.warn(`Order ${request.orderId} is busy, its cancellation is refused for now`);
        throw new ConflictException(ORDERS_ERROR_MESSAGES.BUSY);
      }

      throw error;
    }
  }

  private async cancelInTransaction(
    orderTx: OrderTransaction,
    { orderId, clientId, changedBy, comment }: CancelOrderRequest,
  ): Promise<OrderCancellation> {
    const { tx } = orderTx;
    const [order] = await tx
      .select({ status: orders.status, courierId: orders.courierId })
      .from(orders)
      .where(
        and(
          eq(orders.orderId, orderId),
          clientId === undefined ? undefined : eq(orders.clientId, clientId),
        ),
      )
      .limit(SINGLE_ROW_LIMIT)
      .for(ROW_LOCK_UPDATE);

    if (!order || !CANCELLABLE_STATUSES.includes(order.status)) {
      return { cancelled: false, status: order?.status ?? null };
    }

    const revoked = await tx
      .update(orderOffers)
      .set({ status: ORDER_OFFER_STATUS.REVOKED })
      .where(
        and(eq(orderOffers.orderId, orderId), eq(orderOffers.status, ORDER_OFFER_STATUS.PENDING)),
      )
      .returning({ offerId: orderOffers.offerId, courierId: orderOffers.courierId });
    const updated = await transitionOrderStatus(orderTx, {
      orderId,
      from: CANCELLABLE_STATUSES,
      to: ORDER_STATUS.CANCELLED,
      changedBy,
      comment,
    });

    if (!updated) {
      return { cancelled: false, status: order.status };
    }

    const refund = await this.paymentCancellation.releaseOrderPayments(orderId);

    return { cancelled: true, refund, revoked, courierId: order.courierId };
  }

  private announceSafely(
    orderId: number,
    cancellation: Extract<OrderCancellation, { cancelled: true }>,
  ): void {
    try {
      this.announce(orderId, cancellation);
    } catch (error) {
      this.logger.error(
        `Couriers of order ${orderId} not told of the cancellation: ${describeError(error)}`,
      );
    }
  }

  private announce(
    orderId: number,
    { revoked, courierId }: Extract<OrderCancellation, { cancelled: true }>,
  ): void {
    for (const offer of revoked) {
      this.events.toCourier(offer.courierId, SOCKET_EVENTS.OFFER_CLOSED, {
        offerId: offer.offerId,
      });
    }

    if (courierId !== null) {
      this.events.toCourier(courierId, SOCKET_EVENTS.ORDER_CANCELLED, { orderId });
      this.events.removeCourierFromOrder(orderId, courierId);
    }
  }
}
