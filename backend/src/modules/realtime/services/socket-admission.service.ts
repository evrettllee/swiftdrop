import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Socket } from 'socket.io';
import { ENV_KEYS } from '@/config/env.constants';
import { CourierProfilesService } from '@/modules/couriers/services/courier-profiles.service';
import { SOCKET_ERRORS } from '../constants/realtime.constants';
import type { AppSocketData } from '../types/realtime.types';
import { buildSocketData } from '../utils/socket-data';
import { SocketAuthService } from './socket-auth.service';
import { SocketSessionTimersService } from './socket-session-timers.service';

// Who may open the app socket. The checks run in the handshake, so a refused client never gets a
// connection at all.
@Injectable()
export class SocketAdmissionService {
  private readonly appOrigin: string;

  constructor(
    private readonly socketAuth: SocketAuthService,
    private readonly profiles: CourierProfilesService,
    private readonly sessionTimers: SocketSessionTimersService,
    config: ConfigService,
  ) {
    this.appOrigin = new URL(config.getOrThrow<string>(ENV_KEYS.APP_URL)).origin;
  }

  // The cookie goes with a socket from any page, so the page itself must be ours. Every role that
  // may not connect gets the same refusal as a missing session. Throws the reason of a refusal.
  async admit(socket: Socket): Promise<AppSocketData> {
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

    return data;
  }
}
