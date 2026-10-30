import { Injectable } from '@nestjs/common';
import type { OrderStatusChange } from '@/common/database/order-status-transition';
import {
  SOCKET_EVENTS,
  STAFF_ORDER_EVENT_KIND,
} from '@/modules/realtime/constants/socket-events.constants';
import { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import type { StaffOrderEvent, StaffOrderEventKind } from '@/modules/realtime/types/realtime.types';
import type { OrderStatusEvent } from '../types/tracking.types';

export type StaffOrderChange = Pick<
  OrderStatusChange,
  'orderId' | 'status' | 'statusChangedAt' | 'courierId'
>;

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

  publishCreated(order: StaffOrderChange): void {
    this.toStaff(STAFF_ORDER_EVENT_KIND.CREATED, order);
  }

  private publishStatus(change: OrderStatusChange): void {
    const { orderId, status, estimatedDeliveryAt } = change;
    const event: OrderStatusEvent = {
      orderId,
      status,
      estimatedDeliveryAt: estimatedDeliveryAt?.toISOString() ?? null,
    };

    this.events.toOrder(orderId, SOCKET_EVENTS.ORDER_STATUS, event);
    this.toStaff(STAFF_ORDER_EVENT_KIND.STATUS, change);
  }

  private toStaff(kind: StaffOrderEventKind, change: StaffOrderChange): void {
    const event: StaffOrderEvent = {
      orderId: change.orderId,
      kind,
      status: change.status,
      statusChangedAt: change.statusChangedAt.toISOString(),
      courierId: change.courierId,
    };

    this.events.toStaff(SOCKET_EVENTS.STAFF_ORDER, event);
  }
}
