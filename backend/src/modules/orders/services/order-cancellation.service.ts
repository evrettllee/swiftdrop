import {
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import { FINISHED_STATUSES, ORDERS_ERROR_MESSAGES } from '../constants/orders.constants';
import type { CancelledOrder } from '../types/orders.types';
import { CancelOrderService } from './cancel-order.service';

@Injectable()
export class OrderCancellationService {
  private readonly logger = new Logger(OrderCancellationService.name);

  constructor(private readonly cancelOrder: CancelOrderService) {}

  async cancel(clientId: number, orderId: number): Promise<CancelledOrder> {
    const outcome = await this.cancelOrder.cancel({
      orderId,
      clientId,
      changedBy: clientId,
      comment: null,
    });

    if (!outcome.cancelled) {
      throw explainRefusal(outcome.status);
    }

    this.logger.log(`Order ${orderId} cancelled by client ${clientId}`);

    return { orderId, status: ORDER_STATUS.CANCELLED };
  }
}

function explainRefusal(status: OrderStatus | null): HttpException {
  if (status === null) {
    return new NotFoundException(ORDERS_ERROR_MESSAGES.NOT_FOUND);
  }

  return new ConflictException(
    FINISHED_STATUSES.includes(status)
      ? ORDERS_ERROR_MESSAGES.ALREADY_FINISHED
      : ORDERS_ERROR_MESSAGES.CANNOT_CANCEL,
  );
}
