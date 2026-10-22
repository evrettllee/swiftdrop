import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { ENV_KEYS } from '../../../config/env.constants';
import { SOCKET_ERRORS, SOCKET_PATH } from '../../realtime/constants/realtime.constants';
import { SocketAuthService } from '../../realtime/services/socket-auth.service';
import { SocketSessionTimersService } from '../../realtime/services/socket-session-timers.service';
import {
  COURIER_SOCKET_EVENTS,
  COURIER_SOCKET_PING_INTERVAL_MS,
  COURIER_SOCKET_PING_TIMEOUT_MS,
  COURIERS_SOCKET_NAMESPACE,
  courierRoom,
  LOCATION_UPDATE_REJECTIONS,
  orderRoom,
} from '../constants/couriers-socket.constants';
import { CourierLocationService } from '../services/courier-location.service';
import { CourierProfilesService } from '../services/courier-profiles.service';
import { OrderRoomsService } from '../services/order-rooms.service';
import type {
  AppSocketData,
  EmitToOrderOptions,
  LocationAck,
  OrderJoinAck,
} from '../types/couriers-socket.types';
import { buildSocketData } from '../utils/socket-data';

// The HTTP rate limiter cannot read a socket message: positions and order joins have their own
// limits.
@SkipThrottle()
@WebSocketGateway({
  path: SOCKET_PATH,
  namespace: COURIERS_SOCKET_NAMESPACE,
  serveClient: false,
  pingInterval: COURIER_SOCKET_PING_INTERVAL_MS,
  pingTimeout: COURIER_SOCKET_PING_TIMEOUT_MS,
})
export class CouriersGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CouriersGateway.name);
  private readonly appOrigin: string;
  private namespace: Namespace | null = null;

  constructor(
    private readonly socketAuth: SocketAuthService,
    private readonly profiles: CourierProfilesService,
    private readonly locations: CourierLocationService,
    private readonly orderRooms: OrderRoomsService,
    private readonly sessionTimers: SocketSessionTimersService,
    config: ConfigService,
  ) {
    this.appOrigin = new URL(config.getOrThrow<string>(ENV_KEYS.APP_URL)).origin;
  }

  // Checks run in the handshake, so a refused client never gets a connection at all.
  afterInit(namespace: Namespace): void {
    this.namespace = namespace;
    namespace.use((socket, next) => {
      this.admit(socket).then(
        () => next(),
        (error: unknown) =>
          next(error instanceof Error ? error : new Error(SOCKET_ERRORS.UNAUTHORIZED)),
      );
    });
  }

  async handleConnection(socket: Socket): Promise<void> {
    const data = socket.data as AppSocketData;

    if (data.role === ROLE.COURIER) {
      await socket.join(courierRoom(data.courierProfileId));
    }

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
      ? this.locations.update(data, body)
      : { ok: false, reason: LOCATION_UPDATE_REJECTIONS.FORBIDDEN };
  }

  // The cookie goes with a socket from any page, so the page itself must be ours. Every role that
  // may not connect gets the same refusal as a missing session.
  private async admit(socket: Socket): Promise<void> {
    if (socket.handshake.headers.origin !== this.appOrigin) {
      throw new Error(SOCKET_ERRORS.ORIGIN_NOT_ALLOWED);
    }

    const session = await this.socketAuth.authenticate(socket.handshake.headers.cookie);

    // A token with less than a second left still passes the check of its seconds-precise expiry.
    if (!session || !this.sessionTimers.hasTimeLeft(session.expiresAtMs)) {
      throw new Error(SOCKET_ERRORS.UNAUTHORIZED);
    }

    const data = await buildSocketData(session, (userId) => this.profiles.getProfileId(userId));

    if (!data) {
      throw new Error(SOCKET_ERRORS.UNAUTHORIZED);
    }

    socket.data = data;
  }
}
