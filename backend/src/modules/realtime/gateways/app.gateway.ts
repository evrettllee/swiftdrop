import { Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { ROLE } from '@/common/enums/role.enum';
import { LOCATION_UPDATE_REJECTIONS } from '@/modules/couriers/constants/courier-location.constants';
import { CourierLocationEventsService } from '@/modules/couriers/services/courier-location-events.service';
import { CourierLocationService } from '@/modules/couriers/services/courier-location.service';
import type { LocationAck } from '@/modules/couriers/types/courier-location.types';
import {
  APP_SOCKET_NAMESPACE,
  courierRoom,
  SOCKET_MAX_PAYLOAD_BYTES,
  SOCKET_PATH,
  SOCKET_PING_INTERVAL_MS,
  SOCKET_PING_TIMEOUT_MS,
  STAFF_ROOM,
  userRoom,
} from '../constants/realtime.constants';
import { SOCKET_EVENTS } from '../constants/socket-events.constants';
import { OrderRoomsService } from '../services/order-rooms.service';
import { RealtimeEventsService } from '../services/realtime-events.service';
import { SocketAdmissionService } from '../services/socket-admission.service';
import { SocketSessionTimersService } from '../services/socket-session-timers.service';
import type { AppSocketData, CourierSocketData, OrderJoinAck } from '../types/realtime.types';
import { closeAfterAnswer } from '../utils/socket-close';
import { isStaffSocket } from '../utils/socket-data';
import { admitInHandshake } from '../utils/socket-handshake';
import { toStaffCourierLocation } from '../utils/staff-courier-event';

function roomsOnConnect(data: AppSocketData): string[] {
  const rooms = [userRoom(data.userId)];

  if (data.role === ROLE.COURIER) {
    rooms.push(courierRoom(data.courierProfileId));
  } else if (isStaffSocket(data)) {
    rooms.push(STAFF_ROOM);
  }

  return rooms;
}

// The HTTP rate limiter cannot read a socket message: positions and order joins have their own
// limits.
@SkipThrottle()
@WebSocketGateway({
  path: SOCKET_PATH,
  namespace: APP_SOCKET_NAMESPACE,
  serveClient: false,
  pingInterval: SOCKET_PING_INTERVAL_MS,
  pingTimeout: SOCKET_PING_TIMEOUT_MS,
  maxHttpBufferSize: SOCKET_MAX_PAYLOAD_BYTES,
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  constructor(
    private readonly admission: SocketAdmissionService,
    private readonly locations: CourierLocationService,
    private readonly orderRooms: OrderRoomsService,
    private readonly sessionTimers: SocketSessionTimersService,
    private readonly locationEvents: CourierLocationEventsService,
    private readonly events: RealtimeEventsService,
  ) {}

  afterInit(namespace: Namespace): void {
    this.events.attach(namespace);
    admitInHandshake(namespace, (socket) => this.admission.admit(socket));
  }

  async handleConnection(socket: Socket): Promise<void> {
    const data = socket.data as AppSocketData;

    await socket.join(roomsOnConnect(data));

    this.sessionTimers.schedule(socket, data.sessionExpiresAtMs);
    this.logger.log(`User ${data.userId} (${data.role}) connected`);
  }

  handleDisconnect(socket: Socket): void {
    this.sessionTimers.clear(socket.id);
  }

  @SubscribeMessage(SOCKET_EVENTS.ORDER_JOIN)
  joinOrder(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): Promise<OrderJoinAck> {
    return this.orderRooms.join(socket, body);
  }

  @SubscribeMessage(SOCKET_EVENTS.ORDER_LEAVE)
  leaveOrder(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): Promise<void> {
    return this.orderRooms.leave(socket, body);
  }

  // Only a courier sends positions: any other socket is refused without looking at the body.
  @SubscribeMessage(SOCKET_EVENTS.LOCATION_UPDATE)
  updateLocation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): Promise<LocationAck> | LocationAck {
    const data = socket.data as AppSocketData;

    return data.role === ROLE.COURIER
      ? this.shareLocation(socket, data, body)
      : { ok: false, reason: LOCATION_UPDATE_REJECTIONS.FORBIDDEN };
  }

  // The acknowledgement goes out when this promise resolves; the room gets the position on the
  // next turn of the event loop, after it. A courier blocked since the socket opened is told so,
  // then the socket is closed. The courier does not get their own position back.
  private async shareLocation(
    socket: Socket,
    data: CourierSocketData,
    body: unknown,
  ): Promise<LocationAck> {
    const { ack, event, saved } = await this.locations.update(data, body);

    if (!ack.ok && ack.reason === LOCATION_UPDATE_REJECTIONS.UNAUTHORIZED) {
      closeAfterAnswer(socket);
    }

    if (event) {
      setImmediate(() => {
        this.events.toOrder(event.orderId, SOCKET_EVENTS.COURIER_LOCATION, event, {
          exceptCourierProfileId: data.courierProfileId,
        });
        this.locationEvents.publish(event);
      });
    }

    if (saved) {
      setImmediate(() =>
        this.events.toStaff(SOCKET_EVENTS.STAFF_COURIER_LOCATION, toStaffCourierLocation(saved)),
      );
    }

    return ack;
  }
}
