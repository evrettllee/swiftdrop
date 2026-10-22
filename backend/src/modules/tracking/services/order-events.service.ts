import { Injectable, Logger } from '@nestjs/common';
import type { OrderStatusChange } from '../../../common/database/order-status-transition';
import { describeError } from '../../../common/utils/describe-error';
import { CouriersGateway } from '../../couriers/gateways/couriers.gateway';
import { ORDER_ROOM_EVENTS } from '../constants/tracking.constants';
import type { OrderStatusEvent } from '../types/tracking.types';

// Tells the room of an order what happened to it. A failed send is only logged: the change is
// already committed, and the request, the webhook or the job that made it must not fail for it.
@Injectable()
export class OrderEventsService {
  private readonly logger = new Logger(OrderEventsService.name);

  constructor(private readonly gateway: CouriersGateway) {}

  publishStatusChanges(changes: readonly OrderStatusChange[]): void {
    for (const change of changes) {
      this.publishStatus(change);
    }
  }

  private publishStatus({ orderId, status, estimatedDeliveryAt }: OrderStatusChange): void {
    const event: OrderStatusEvent = {
      orderId,
      status,
      estimatedDeliveryAt: estimatedDeliveryAt?.toISOString() ?? null,
    };

    try {
      this.gateway.emitToOrder(orderId, ORDER_ROOM_EVENTS.ORDER_STATUS, event);
    } catch (error) {
      this.logger.error(`Status ${status} of order ${orderId} not sent: ${describeError(error)}`);
    }
  }
}
