import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Socket } from 'socket.io';
import { orderAccess } from '@/common/database/order-participant';
import { describeError } from '@/common/utils/describe-error';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import {
  isOrderRoom,
  ORDER_JOIN_REJECTIONS,
  ORDER_ROOMS_MAX_PER_SOCKET,
  orderRoom,
  PARTICIPANT_ACCESS,
} from '../constants/couriers-socket.constants';
import { orderRoomBodySchema } from '../dto/order-room.dto';
import type {
  AppSocketData,
  OrderJoinAck,
  ParticipantAccess,
} from '../types/couriers-socket.types';
import { countJoinAttempt, rejectJoinAttempt } from '../utils/order-join';
import { closeAfterAnswer } from '../utils/socket-close';

const JOINED: OrderJoinAck = { ok: true };
const TOO_MANY_ROOMS: OrderJoinAck = { ok: false, reason: ORDER_JOIN_REJECTIONS.TOO_MANY_ROOMS };
const NOT_FOUND: OrderJoinAck = { ok: false, reason: ORDER_JOIN_REJECTIONS.NOT_FOUND };

// The personal courier room is not an order room and does not count against the limit.
function isRoomLimitReached(socket: Socket): boolean {
  return [...socket.rooms].filter(isOrderRoom).length >= ORDER_ROOMS_MAX_PER_SOCKET;
}

// Who may be in the room of an order. The room is open to the owner of the order and its courier,
// in any status: the chat history stays readable after the delivery.
@Injectable()
export class OrderRoomsService {
  private readonly logger = new Logger(OrderRoomsService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // Every attempt counts against the limit, valid or not, so order ids cannot be probed quickly.
  // A room the socket is already in answers at once, without a query.
  async join(socket: Socket, body: unknown): Promise<OrderJoinAck> {
    const data = socket.data as AppSocketData;
    const nowMs = Date.now();

    data.orderJoinAttemptsMs = countJoinAttempt(data.orderJoinAttemptsMs, nowMs);

    const rejection = rejectJoinAttempt(data, nowMs);
    const parsed = orderRoomBodySchema.safeParse(body);
    let ack = JOINED;

    if (rejection) {
      ack = { ok: false, reason: rejection };
    } else if (!parsed.success) {
      ack = { ok: false, reason: ORDER_JOIN_REJECTIONS.INVALID };
    } else if (socket.rooms.has(orderRoom(parsed.data.orderId))) {
      ack = JOINED;
    } else if (isRoomLimitReached(socket)) {
      ack = TOO_MANY_ROOMS;
    } else {
      ack = await this.enterIfParticipant(socket, data, parsed.data.orderId);
    }

    return ack;
  }

  // Leaving is silent: a wrong body or a room the socket is not in changes nothing.
  async leave(socket: Socket, body: unknown): Promise<void> {
    const parsed = orderRoomBodySchema.safeParse(body);

    if (parsed.success) {
      await socket.leave(orderRoom(parsed.data.orderId));
    }
  }

  // The same check as the chat: a foreign order and a missing one look and take the same. The
  // account may have been blocked after the socket opened, so the same query reads that too.
  async participantAccess(data: AppSocketData, orderId: number): Promise<ParticipantAccess> {
    const { participant, actorBlocked } = await orderAccess(this.db, orderId, {
      role: data.role,
      userId: data.userId,
    });
    let access: ParticipantAccess = PARTICIPANT_ACCESS.MEMBER;

    if (actorBlocked) {
      access = PARTICIPANT_ACCESS.BLOCKED;
    } else if (!participant) {
      access = PARTICIPANT_ACCESS.OUTSIDER;
    }

    return access;
  }

  // The limit is checked again after the query: two joins sent at once both passed the first
  // check. A socket closed while the query ran is not put into the room. A blocked user gets the
  // answer of a foreign order, then the socket is closed.
  private async enterIfParticipant(
    socket: Socket,
    data: AppSocketData,
    orderId: number,
  ): Promise<OrderJoinAck> {
    let ack = JOINED;

    try {
      const access = await this.participantAccess(data, orderId);

      if (access !== PARTICIPANT_ACCESS.MEMBER) {
        ack = NOT_FOUND;
      } else if (isRoomLimitReached(socket)) {
        ack = TOO_MANY_ROOMS;
      } else if (socket.connected) {
        await socket.join(orderRoom(orderId));
      }

      if (access === PARTICIPANT_ACCESS.BLOCKED) {
        closeAfterAnswer(socket);
      }
    } catch (error) {
      this.logger.error(
        `User ${data.userId} not let into order ${orderId}: ${describeError(error)}`,
      );
      ack = { ok: false, reason: ORDER_JOIN_REJECTIONS.UNAVAILABLE };
    }

    return ack;
  }
}
