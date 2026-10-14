import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { isLockTimeout } from '../../../common/database/pg-errors';
import { ROLE } from '../../../common/enums/role.enum';
import { geoPointSchema } from '../../../common/schemas/geo-point.schema';
import { ENV_KEYS } from '../../../config/env.constants';
import { SOCKET_ERRORS, SOCKET_PATH } from '../../realtime/constants/realtime.constants';
import { SocketAuthService } from '../../realtime/services/socket-auth.service';
import {
  COURIER_SOCKET_EVENTS,
  COURIERS_SOCKET_NAMESPACE,
  courierRoom,
  LOCATION_UPDATE_REJECTIONS,
} from '../constants/couriers-socket.constants';
import { CourierLocationService } from '../services/courier-location.service';
import { CourierProfilesService } from '../services/courier-profiles.service';
import type { CourierSocketData, LocationAck } from '../types/couriers-socket.types';
import { rejectLocationUpdate } from '../utils/location-update';

// The HTTP rate limiter cannot read a socket message; positions have their own limit below.
@SkipThrottle()
@WebSocketGateway({ path: SOCKET_PATH, namespace: COURIERS_SOCKET_NAMESPACE, serveClient: false })
export class CouriersGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(CouriersGateway.name);
  private readonly appOrigin: string;

  constructor(
    private readonly socketAuth: SocketAuthService,
    private readonly profiles: CourierProfilesService,
    private readonly locations: CourierLocationService,
    config: ConfigService,
  ) {
    this.appOrigin = new URL(config.getOrThrow<string>(ENV_KEYS.APP_URL)).origin;
  }

  // Checks run in the handshake, so a refused client never gets a connection at all.
  afterInit(namespace: Namespace): void {
    namespace.use((socket, next) => {
      this.admit(socket).then(
        () => next(),
        (error: unknown) =>
          next(error instanceof Error ? error : new Error(SOCKET_ERRORS.UNAUTHORIZED)),
      );
    });
  }

  async handleConnection(socket: Socket): Promise<void> {
    const data = socket.data as CourierSocketData;

    await socket.join(courierRoom(data.courierProfileId));
    this.logger.log(`Courier ${data.courierProfileId} connected`);
  }

  @SubscribeMessage(COURIER_SOCKET_EVENTS.LOCATION_UPDATE)
  async updateLocation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): Promise<LocationAck> {
    const data = socket.data as CourierSocketData;
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
      ack = await this.savePosition(data.courierProfileId, point.data, now);
    }

    return ack;
  }

  private async savePosition(
    courierProfileId: number,
    point: { latitude: number; longitude: number },
    at: Date,
  ): Promise<LocationAck> {
    let ack: LocationAck = { ok: true };

    try {
      if (!(await this.locations.save(courierProfileId, point, at))) {
        ack = { ok: false, reason: LOCATION_UPDATE_REJECTIONS.OFF_SHIFT };
      }
    } catch (error) {
      if (!isLockTimeout(error)) {
        throw error;
      }

      // Going on or off shift holds the profile row: the next position comes in 15 seconds anyway.
      ack = { ok: false, reason: LOCATION_UPDATE_REJECTIONS.BUSY };
    }

    return ack;
  }

  // The cookie goes with a socket from any page, so the page itself must be ours.
  private async admit(socket: Socket): Promise<void> {
    if (socket.handshake.headers.origin !== this.appOrigin) {
      throw new Error(SOCKET_ERRORS.ORIGIN_NOT_ALLOWED);
    }

    const session = await this.socketAuth.authenticate(socket.handshake.headers.cookie);

    if (!session || session.user.role !== ROLE.COURIER) {
      throw new Error(SOCKET_ERRORS.UNAUTHORIZED);
    }

    const data: CourierSocketData = {
      userId: session.user.userId,
      courierProfileId: await this.profiles.getProfileId(session.user.userId),
      sessionExpiresAtMs: session.expiresAtMs,
      lastLocationAtMs: null,
    };

    socket.data = data;
  }
}
