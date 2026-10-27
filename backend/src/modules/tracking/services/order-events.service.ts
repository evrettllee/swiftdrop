import { Injectable } from '@nestjs/common';
import type { OrderStatusChange } from '@/common/database/order-status-transition';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import type { OrderStatusEvent } from '../types/tracking.types';

// Tells the room of an order and the staff what happened to it. A failed send is only logged: the
// change is already committed, and the request, the webhook or the job that made it must not fail
// for it.
@Injectable()
export class OrderEventsService {
  constructor(private readonly events: RealtimeEventsService) {}

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

    this.events.toOrder(orderId, SOCKET_EVENTS.ORDER_STATUS, event);
    this.events.toStaff(SOCKET_EVENTS.ORDER_STATUS, event);
  }
}
