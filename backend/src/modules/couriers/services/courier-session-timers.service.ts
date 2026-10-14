import { Injectable, Logger } from '@nestjs/common';
import type { Socket } from 'socket.io';
import { sessionDisconnectDelayMs } from '../utils/session-expiry';

// Closes a courier socket when the access token it was opened with expires: a token cannot be
// refreshed on an open socket, so the client reconnects with the new cookie.
@Injectable()
export class CourierSessionTimersService {
  private readonly logger = new Logger(CourierSessionTimersService.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();

  hasTimeLeft(expiresAtMs: number, nowMs: number = Date.now()): boolean {
    return sessionDisconnectDelayMs(expiresAtMs, nowMs) > 0;
  }

  schedule(socket: Socket, expiresAtMs: number, nowMs: number = Date.now()): void {
    const delayMs = Math.max(sessionDisconnectDelayMs(expiresAtMs, nowMs), 0);
    const timer = setTimeout(() => {
      this.logger.log(`Socket ${socket.id} closed: its session expired`);
      socket.disconnect(true);
    }, delayMs);

    this.timers.set(socket.id, timer);
  }

  clear(socketId: string): void {
    clearTimeout(this.timers.get(socketId));
    this.timers.delete(socketId);
  }
}
