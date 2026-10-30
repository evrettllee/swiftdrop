import {
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ORDER_NOT_FOUND_MESSAGE } from '@/common/constants/orders.constants';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import {
  FINISHED_STATUSES,
  ORDERS_ERROR_MESSAGES,
} from '@/modules/orders/constants/orders.constants';
import { CancelOrderService } from '@/modules/orders/services/cancel-order.service';
import { ORDER_NOT_CANCELLABLE_CODE } from '../constants/manager-cancellation.constants';
import type { StaffCancelledOrder } from '../types/manager-cancellation.types';

export type StaffCancelRequest = { managerUserId: number; orderId: number; reason: string };

@Injectable()
export class ManagerOrderCancellationService {
  private readonly logger = new Logger(ManagerOrderCancellationService.name);

  constructor(private readonly cancelOrder: CancelOrderService) {}

  async cancel({
    managerUserId,
    orderId,
    reason,
  }: StaffCancelRequest): Promise<StaffCancelledOrder> {
    const outcome = await this.cancelOrder.cancel({
      orderId,
      changedBy: managerUserId,
      comment: reason,
    });

    if (!outcome.cancelled) {
      if (outcome.status === null) {
        throw new NotFoundException(ORDER_NOT_FOUND_MESSAGE);
      }

      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        code: ORDER_NOT_CANCELLABLE_CODE,
        message: FINISHED_STATUSES.includes(outcome.status)
          ? ORDERS_ERROR_MESSAGES.ALREADY_FINISHED
          : ORDERS_ERROR_MESSAGES.CANNOT_CANCEL,
      });
    }

    this.logger.log(
      `Manager ${managerUserId} cancelled order ${orderId}, refund ${outcome.refund}`,
    );

    return { orderId, status: ORDER_STATUS.CANCELLED, refund: outcome.refund };
  }
}
