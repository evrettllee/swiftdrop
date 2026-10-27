import { Injectable, Logger } from '@nestjs/common';
import type { Namespace } from 'socket.io';
import { describeError } from '@/common/utils/describe-error';
import { courierRoom, orderRoom, STAFF_ROOM, userRoom } from '../constants/realtime.constants';
import type { EmitToOrderOptions } from '../types/realtime.types';

@Injectable()
export class RealtimeEventsService {
  private readonly logger = new Logger(RealtimeEventsService.name);
  private namespace: Namespace | null = null;

  attach(namespace: Namespace): void {
    this.namespace = namespace;
  }

  toOrder(
    orderId: number,
    event: string,
    payload: unknown,
    options: EmitToOrderOptions = {},
  ): void {
    const { exceptCourierProfileId } = options;

    this.run(`${event} to order ${orderId}`, (namespace) => {
      const room = namespace.to(orderRoom(orderId));
      const target =
        exceptCourierProfileId === undefined
          ? room
          : room.except(courierRoom(exceptCourierProfileId));

      target.emit(event, payload);
    });
  }

  toCourier(courierProfileId: number, event: string, payload: unknown): void {
    this.run(`${event} to courier ${courierProfileId}`, (namespace) =>
      namespace.to(courierRoom(courierProfileId)).emit(event, payload),
    );
  }

  toUser(userId: number, event: string, payload: unknown): void {
    this.run(`${event} to user ${userId}`, (namespace) =>
      namespace.to(userRoom(userId)).emit(event, payload),
    );
  }

  toStaff(event: string, payload: unknown): void {
    this.run(`${event} to staff`, (namespace) => namespace.to(STAFF_ROOM).emit(event, payload));
  }

  removeCourierFromOrder(orderId: number, courierProfileId: number): void {
    this.run(`removal of courier ${courierProfileId} from order ${orderId}`, (namespace) =>
      namespace.in(courierRoom(courierProfileId)).socketsLeave(orderRoom(orderId)),
    );
  }

  disconnectUser(userId: number): void {
    this.run(`disconnection of user ${userId}`, (namespace) =>
      namespace.in(userRoom(userId)).disconnectSockets(true),
    );
  }

  private run(action: string, send: (namespace: Namespace) => unknown): void {
    if (!this.namespace) {
      return;
    }

    try {
      send(this.namespace);
    } catch (error) {
      this.logger.error(`Socket ${action} failed: ${describeError(error)}`);
    }
  }
}
