import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  ROW_LOCK_NO_KEY_UPDATE,
  SINGLE_ROW_LIMIT,
} from '../../../common/constants/database.constants';
import { MS_PER_MINUTE } from '../../../common/constants/time.constants';
import { transitionOrderStatus } from '../../../common/database/order-status-transition';
import { isLockTimeout } from '../../../common/database/pg-errors';
import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database, Transaction } from '../../../database/database.module';
import { orders } from '../../../database/schema';
import {
  DELIVERIES_ERROR_MESSAGES,
  DELIVERY_CODE_LOCK_MS,
  DELIVERY_CODE_MAX_ATTEMPTS,
  HANDOVER_OUTCOME,
} from '../constants/deliveries.constants';
import type { CourierIdentity, CourierOrder, HandoverOutcome } from '../types/deliveries.types';
import { deliveryCodesMatch } from '../utils/delivery-code';
import { CourierOrderViewsService } from './courier-order-views.service';

@Injectable()
export class DeliveryHandoverService {
  private readonly logger = new Logger(DeliveryHandoverService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly views: CourierOrderViewsService,
  ) {}

  async deliver(
    courier: CourierIdentity,
    orderId: number,
    code: string,
    now: Date = new Date(),
  ): Promise<CourierOrder> {
    let outcome: HandoverOutcome;

    try {
      outcome = await this.db.transaction((tx) => this.checkCode(tx, courier, orderId, code, now));
    } catch (error) {
      if (isLockTimeout(error)) {
        throw new ConflictException(DELIVERIES_ERROR_MESSAGES.BUSY);
      }

      throw error;
    }

    // A wrong code must stay counted, so its error is thrown only now, after the commit.
    this.throwUnlessDelivered(outcome, now);
    this.logger.log(`Courier ${courier.courierProfileId} delivered order ${orderId}`);

    const order = await this.views.findOfCourier(orderId, courier.courierProfileId);

    if (!order) {
      throw new NotFoundException(DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    return order;
  }

  // The order row stays locked, so two codes entered at once never spend one attempt twice.
  private async checkCode(
    tx: Transaction,
    courier: CourierIdentity,
    orderId: number,
    code: string,
    now: Date,
  ): Promise<HandoverOutcome> {
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

    await transitionOrderStatus(tx, {
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

  private throwUnlessDelivered(outcome: HandoverOutcome, now: Date): void {
    switch (outcome.kind) {
      case HANDOVER_OUTCOME.NOT_FOUND:
        throw new NotFoundException(DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND);
      case HANDOVER_OUTCOME.WRONG_STEP:
        throw new ConflictException(DELIVERIES_ERROR_MESSAGES.WRONG_STEP);
      case HANDOVER_OUTCOME.LOCKED: {
        const minutesLeft = Math.ceil(
          (outcome.lockedUntil.getTime() - now.getTime()) / MS_PER_MINUTE,
        );
        throw new HttpException(
          DELIVERIES_ERROR_MESSAGES.CODE_LOCKED(minutesLeft),
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      case HANDOVER_OUTCOME.WRONG_CODE:
        throw new UnprocessableEntityException(
          DELIVERIES_ERROR_MESSAGES.WRONG_CODE(outcome.attemptsLeft),
        );
      case HANDOVER_OUTCOME.DELIVERED:
        break;
    }
  }
}
