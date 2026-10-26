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
import { ROLE } from '../../../common/enums/role.enum';
import { describeError } from '../../../common/utils/describe-error';
import { SOCKET_PATH } from '../../realtime/constants/realtime.constants';
import { SocketSessionTimersService } from '../../realtime/services/socket-session-timers.service';
import {
  COURIER_SOCKET_EVENTS,
  COURIER_SOCKET_PING_INTERVAL_MS,
  COURIER_SOCKET_PING_TIMEOUT_MS,
  COURIERS_SOCKET_NAMESPACE,
  courierRoom,
  LOCATION_UPDATE_REJECTIONS,
  orderRoom,
  SOCKET_MAX_PAYLOAD_BYTES,
  userRoom,
} from '../constants/couriers-socket.constants';
import { CourierLocationEventsService } from '../services/courier-location-events.service';
import { CourierLocationService } from '../services/courier-location.service';
import { OrderRoomsService } from '../services/order-rooms.service';
import { SocketAdmissionService } from '../services/socket-admission.service';
import { closeAfterAnswer } from '../utils/socket-close';
import { admitInHandshake } from '../utils/socket-handshake';
import type {
  AppSocketData,
  CourierLocationEvent,
  CourierSocketData,
  EmitToOrderOptions,
  LocationAck,
  OrderJoinAck,
} from '../types/couriers-socket.types';

// The HTTP rate limiter cannot read a socket message: positions and order joins have their own
// limits.
@SkipThrottle()
@WebSocketGateway({
  path: SOCKET_PATH,
  namespace: COURIERS_SOCKET_NAMESPACE,
  serveClient: false,
  pingInterval: COURIER_SOCKET_PING_INTERVAL_MS,
  pingTimeout: COURIER_SOCKET_PING_TIMEOUT_MS,
  maxHttpBufferSize: SOCKET_MAX_PAYLOAD_BYTES,
})
export class CouriersGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CouriersGateway.name);
  private namespace: Namespace | null = null;

  constructor(
    private readonly admission: SocketAdmissionService,
    private readonly locations: CourierLocationService,
    private readonly orderRooms: OrderRoomsService,
    private readonly sessionTimers: SocketSessionTimersService,
    private readonly locationEvents: CourierLocationEventsService,
  ) {}

  afterInit(namespace: Namespace): void {
    this.namespace = namespace;
    admitInHandshake(namespace, (socket) => this.admission.admit(socket));
  }

  async handleConnection(socket: Socket): Promise<void> {
    const data = socket.data as AppSocketData;
    const rooms = [userRoom(data.userId)];

    if (data.role === ROLE.COURIER) {
      rooms.push(courierRoom(data.courierProfileId));
    }

    await socket.join(rooms);

    this.sessionTimers.schedule(socket, data.sessionExpiresAtMs);
    this.logger.log(`User ${data.userId} (${data.role}) connected`);
  }

  handleDisconnect(socket: Socket): void {
    this.sessionTimers.clear(socket.id);
  }

  // Sends an event to every open tab of the courier; nothing happens when none is open.
  emitToCourier(courierProfileId: number, event: string, payload: unknown): void {
    this.namespace?.to(courierRoom(courierProfileId)).emit(event, payload);
  }

  // Sends an event to everyone who joined the order room: its client and its courier.
  emitToOrder(
    orderId: number,
    event: string,
    payload: unknown,
    options: EmitToOrderOptions = {},
  ): void {
    const room = this.namespace?.to(orderRoom(orderId));
    const { exceptCourierProfileId } = options;
    const target =
      exceptCourierProfileId === undefined
        ? room
        : room?.except(courierRoom(exceptCourierProfileId));

    target?.emit(event, payload);
  }

  // Takes every socket of the courier out of the order room. Not called yet: manual reassignment
  // of a courier (v0.7.0) needs it, so the previous courier stops getting the events of the order.
  removeCourierFromOrder(orderId: number, courierProfileId: number): void {
    this.namespace?.in(courierRoom(courierProfileId)).socketsLeave(orderRoom(orderId));
  }

  // Closes every socket of the user, in every tab. TODO: blocking a user (the admin panel, v0.7.0)
  // calls this, so a blocked account loses its open sockets at once instead of on the next check.
  disconnectUser(userId: number): void {
    this.namespace?.in(userRoom(userId)).disconnectSockets(true);
  }

  @SubscribeMessage(COURIER_SOCKET_EVENTS.ORDER_JOIN)
  joinOrder(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): Promise<OrderJoinAck> {
    return this.orderRooms.join(socket, body);
  }

  @SubscribeMessage(COURIER_SOCKET_EVENTS.ORDER_LEAVE)
  leaveOrder(@ConnectedSocket() socket: Socket, @MessageBody() body: unknown): Promise<void> {
    return this.orderRooms.leave(socket, body);
  }

  // Only a courier sends positions: a client socket is refused without looking at the body.
  @SubscribeMessage(COURIER_SOCKET_EVENTS.LOCATION_UPDATE)
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
  // then the socket is closed.
  private async shareLocation(
    socket: Socket,
    data: CourierSocketData,
    body: unknown,
  ): Promise<LocationAck> {
    const { ack, event } = await this.locations.update(data, body);

    if (!ack.ok && ack.reason === LOCATION_UPDATE_REJECTIONS.UNAUTHORIZED) {
      closeAfterAnswer(socket);
    }

    if (event) {
      setImmediate(() => {
        this.emitLocation(data.courierProfileId, event);
        // Then the listeners, for example the arrival estimate, also outside the acknowledgement.
        this.locationEvents.publish(event);
      });
    }

    return ack;
  }

  // The courier does not get their own position back. A failed send leaves the position stored;
  // the log line has no coordinates.
  private emitLocation(courierProfileId: number, event: CourierLocationEvent): void {
    try {
      this.emitToOrder(event.orderId, COURIER_SOCKET_EVENTS.COURIER_LOCATION, event, {
        exceptCourierProfileId: courierProfileId,
      });
    } catch (error) {
      this.logger.error(
        `Position of courier ${courierProfileId} not sent to order ${event.orderId}: ${describeError(error)}`,
      );
    }
  }
}
