import { Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  ROW_LOCK_NO_KEY_UPDATE,
  SINGLE_ROW_LIMIT,
} from '../../../common/constants/database.constants';
import { withLockConflict } from '../../../common/database/lock-conflict';
import {
  type OrderTransaction,
  transitionOrderStatus,
} from '../../../common/database/order-status-transition';
import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import type { Transaction } from '../../../database/database.module';
import { orders } from '../../../database/schema';
import { OrderTransactionsService } from '../../tracking/services/order-transactions.service';
import {
  DELIVERIES_ERROR_MESSAGES,
  DELIVERY_CODE_LOCK_MS,
  DELIVERY_CODE_MAX_ATTEMPTS,
  HANDOVER_OUTCOME,
} from '../constants/deliveries.constants';
import type { CourierIdentity, CourierOrder, HandoverOutcome } from '../types/deliveries.types';
import { deliveryCodesMatch } from '../utils/delivery-code';
import { handoverError } from '../utils/handover-error';
import { CourierOrderViewsService } from './courier-order-views.service';

@Injectable()
export class DeliveryHandoverService {
  private readonly logger = new Logger(DeliveryHandoverService.name);

  constructor(
    private readonly orderTransactions: OrderTransactionsService,
    private readonly views: CourierOrderViewsService,
  ) {}

  async deliver(
    courier: CourierIdentity,
    orderId: number,
    code: string,
    now: Date = new Date(),
  ): Promise<CourierOrder> {
    const outcome = await withLockConflict(
      () =>
        this.orderTransactions.run((orderTx) =>
          this.checkCode(orderTx, courier, orderId, code, now),
        ),
      DELIVERIES_ERROR_MESSAGES.BUSY,
    );
    // A wrong code must stay counted, so its error is thrown only now, after the commit.
    const error = handoverError(outcome, now);

    if (error) {
      throw error;
    }

    this.logger.log(`Courier ${courier.courierProfileId} delivered order ${orderId}`);

    return this.views.getOfCourier(orderId, courier.courierProfileId);
  }

  // The order row stays locked, so two codes entered at once never spend one attempt twice.
  private async checkCode(
    orderTx: OrderTransaction,
    courier: CourierIdentity,
    orderId: number,
    code: string,
    now: Date,
  ): Promise<HandoverOutcome> {
    const { tx } = orderTx;
    const [order] = await tx
      .select({
        status: orders.status,
        otpCode: orders.otpCode,
        otpFailedAttempts: orders.otpFailedAttempts,
        otpLockedUntil: orders.otpLockedUntil,
      })
      .from(orders)
      .where(and(eq(orders.orderId, orderId), eq(orders.courierId, courier.courierProfileId)))
      .limit(SINGLE_ROW_LIMIT)
      .for(ROW_LOCK_NO_KEY_UPDATE);

    if (!order) {
      return { kind: HANDOVER_OUTCOME.NOT_FOUND };
    }

    if (order.status !== ORDER_STATUS.IN_TRANSIT) {
      return { kind: HANDOVER_OUTCOME.WRONG_STEP };
    }

    if (order.otpLockedUntil && order.otpLockedUntil > now) {
      return { kind: HANDOVER_OUTCOME.LOCKED, lockedUntil: order.otpLockedUntil };
    }

    if (!deliveryCodesMatch(order.otpCode, code)) {
      return this.recordFailure(tx, orderId, order.otpFailedAttempts + 1, now);
    }

    await transitionOrderStatus(orderTx, {
      orderId,
      from: ORDER_STATUS.IN_TRANSIT,
      to: ORDER_STATUS.DELIVERED,
      changedBy: courier.userId,
      courierId: courier.courierProfileId,
      changes: { otpFailedAttempts: 0, otpLockedUntil: null },
    });

    return { kind: HANDOVER_OUTCOME.DELIVERED };
  }

  // The last allowed failure locks the entering and starts a new count for after the lock.
  private async recordFailure(
    tx: Transaction,
    orderId: number,
    attempts: number,
    now: Date,
  ): Promise<HandoverOutcome> {
    const isLocked = attempts >= DELIVERY_CODE_MAX_ATTEMPTS;
    const lockedUntil = new Date(now.getTime() + DELIVERY_CODE_LOCK_MS);

    await tx
      .update(orders)
      .set(
        isLocked
          ? { otpFailedAttempts: 0, otpLockedUntil: lockedUntil }
          : { otpFailedAttempts: attempts },
      )
      .where(eq(orders.orderId, orderId));

    return isLocked
      ? { kind: HANDOVER_OUTCOME.LOCKED, lockedUntil }
      : { kind: HANDOVER_OUTCOME.WRONG_CODE, attemptsLeft: DELIVERY_CODE_MAX_ATTEMPTS - attempts };
  }
}
