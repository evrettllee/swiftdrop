import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { withLockConflict } from '@/common/database/lock-conflict';
import { transitionOrderStatus } from '@/common/database/order-status-transition';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { OrderTransactionsService } from '@/modules/tracking/services/order-transactions.service';
import { DELIVERIES_ERROR_MESSAGES } from '../constants/deliveries.constants';
import type { CourierIdentity, CourierOrder, DeliveryStep } from '../types/deliveries.types';
import { generateDeliveryCode } from '../utils/delivery-code';
import { CourierOrderViewsService } from './courier-order-views.service';

@Injectable()
export class DeliveryProgressService {
  private readonly logger = new Logger(DeliveryProgressService.name);

  constructor(
    private readonly orderTransactions: OrderTransactionsService,
    private readonly views: CourierOrderViewsService,
  ) {}

  // The parcel is with the courier: the client can no longer cancel and gets the delivery code.
  pickUp(courier: CourierIdentity, orderId: number): Promise<CourierOrder> {
    return this.advance(courier, orderId, {
      from: ORDER_STATUS.COURIER_ASSIGNED,
      to: ORDER_STATUS.PICKED_UP,
      changes: { otpCode: generateDeliveryCode(), otpFailedAttempts: 0, otpLockedUntil: null },
    });
  }

  depart(courier: CourierIdentity, orderId: number): Promise<CourierOrder> {
    return this.advance(courier, orderId, {
      from: ORDER_STATUS.PICKED_UP,
      to: ORDER_STATUS.IN_TRANSIT,
    });
  }

  // The order changes only when it is this courier's order at the expected stage; the answer is
  // the order as it is after the attempt.
  private async advance(
    courier: CourierIdentity,
    orderId: number,
    step: DeliveryStep,
  ): Promise<CourierOrder> {
    const moved = await withLockConflict(
      () =>
        this.orderTransactions.run((orderTx) =>
          transitionOrderStatus(orderTx, {
            orderId,
            ...step,
            changedBy: courier.userId,
            courierId: courier.courierProfileId,
          }),
        ),
      DELIVERIES_ERROR_MESSAGES.BUSY,
    );
    const order = await this.views.getOfCourier(orderId, courier.courierProfileId);

    if (!moved) {
      throw new ConflictException(DELIVERIES_ERROR_MESSAGES.WRONG_STEP);
    }

    this.logger.log(`Courier ${courier.courierProfileId} moved order ${orderId} to ${step.to}`);

    return order;
  }
}
