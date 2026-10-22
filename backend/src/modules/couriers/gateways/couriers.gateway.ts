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
import { geoPointSchema } from '../../../common/schemas/geo-point.schema';
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
} from '../constants/couriers-socket.constants';
import { CourierLocationService } from '../services/courier-location.service';
import { CourierProfilesService } from '../services/courier-profiles.service';
import type { AppSocketData, CourierSocketData, LocationAck } from '../types/couriers-socket.types';
import { rejectLocationUpdate } from '../utils/location-update';
import { buildSocketData } from '../utils/socket-data';

// The HTTP rate limiter cannot read a socket message; positions have their own limit below.
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

  // Only a courier sends positions: a client socket is refused without looking at the body.
  @SubscribeMessage(COURIER_SOCKET_EVENTS.LOCATION_UPDATE)
  updateLocation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): Promise<LocationAck> | LocationAck {
    const data = socket.data as AppSocketData;

    return data.role === ROLE.COURIER
      ? this.recordCourierLocation(data, body)
      : { ok: false, reason: LOCATION_UPDATE_REJECTIONS.FORBIDDEN };
  }

  private async recordCourierLocation(
    data: CourierSocketData,
    body: unknown,
  ): Promise<LocationAck> {
    const now = new Date();
    const rejection = rejectLocationUpdate(data, now.getTime());
    const point = geoPointSchema.safeParse(body);
    let ack: LocationAck = { ok: true };

    if (rejection) {
      ack = { ok: false, reason: rejection };
    } else if (!point.success) {
      ack = { ok: false, reason: LOCATION_UPDATE_REJECTIONS.INVALID_LOCATION };
    } else {
      data.lastLocationAtMs = now.getTime();
      ack = await this.locations.record(data.courierProfileId, point.data, now);
    }

    return ack;
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
