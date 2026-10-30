import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Socket } from 'socket.io';
import { findAccessibleTicket } from '@/common/database/ticket-access';
import { describeError } from '@/common/utils/describe-error';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import {
  isTicketRoom,
  ORDER_JOIN_REJECTIONS,
  TICKET_ROOMS_MAX_PER_SOCKET,
  ticketRoom,
} from '../constants/realtime.constants';
import { ticketRoomBodySchema } from '../dto/room.dto';
import type { AppSocketData, OrderJoinAck } from '../types/realtime.types';
import { countJoinAttempt, rejectJoinAttempt } from '../utils/order-join';

const JOINED: OrderJoinAck = { ok: true };
const NOT_FOUND: OrderJoinAck = { ok: false, reason: ORDER_JOIN_REJECTIONS.NOT_FOUND };
const TOO_MANY_ROOMS: OrderJoinAck = { ok: false, reason: ORDER_JOIN_REJECTIONS.TOO_MANY_ROOMS };

function isRoomLimitReached(socket: Socket): boolean {
  return [...socket.rooms].filter(isTicketRoom).length >= TICKET_ROOMS_MAX_PER_SOCKET;
}

@Injectable()
export class TicketRoomsService {
  private readonly logger = new Logger(TicketRoomsService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async join(socket: Socket, body: unknown): Promise<OrderJoinAck> {
    const data = socket.data as AppSocketData;
    const nowMs = Date.now();

    data.orderJoinAttemptsMs = countJoinAttempt(data.orderJoinAttemptsMs, nowMs);

    const rejection = rejectJoinAttempt(data, nowMs);
    const parsed = ticketRoomBodySchema.safeParse(body);

    if (rejection) {
      return { ok: false, reason: rejection };
    }

    if (!parsed.success) {
      return { ok: false, reason: ORDER_JOIN_REJECTIONS.INVALID };
    }

    if (socket.rooms.has(ticketRoom(parsed.data.ticketId))) {
      return JOINED;
    }

    return isRoomLimitReached(socket)
      ? TOO_MANY_ROOMS
      : this.enterIfAllowed(socket, data, parsed.data.ticketId);
  }

  async leave(socket: Socket, body: unknown): Promise<void> {
    const parsed = ticketRoomBodySchema.safeParse(body);

    if (parsed.success) {
      await socket.leave(ticketRoom(parsed.data.ticketId));
    }
  }

  private async enterIfAllowed(
    socket: Socket,
    data: AppSocketData,
    ticketId: number,
  ): Promise<OrderJoinAck> {
    try {
      const ticket = await findAccessibleTicket(this.db, ticketId, {
        userId: data.userId,
        role: data.role,
      });

      if (!ticket) {
        return NOT_FOUND;
      }

      if (isRoomLimitReached(socket)) {
        return TOO_MANY_ROOMS;
      }

      if (socket.connected) {
        await socket.join(ticketRoom(ticketId));
      }

      return JOINED;
    } catch (error) {
      this.logger.error(
        `User ${data.userId} not let into ticket ${ticketId}: ${describeError(error)}`,
      );

      return { ok: false, reason: ORDER_JOIN_REJECTIONS.UNAVAILABLE };
    }
  }
}
