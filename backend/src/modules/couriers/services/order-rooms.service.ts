import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Socket } from 'socket.io';
import { SINGLE_ROW_LIMIT } from '../../../common/constants/database.constants';
import { ROLE } from '../../../common/enums/role.enum';
import { describeError } from '../../../common/utils/describe-error';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { orders } from '../../../database/schema';
import {
  isOrderRoom,
  ORDER_JOIN_REJECTIONS,
  ORDER_ROOMS_MAX_PER_SOCKET,
  orderRoom,
} from '../constants/couriers-socket.constants';
import { orderRoomBodySchema } from '../dto/order-room.dto';
import type { AppSocketData, OrderJoinAck } from '../types/couriers-socket.types';
import { countJoinAttempt, rejectJoinAttempt } from '../utils/order-join';

const JOINED: OrderJoinAck = { ok: true };
const TOO_MANY_ROOMS: OrderJoinAck = { ok: false, reason: ORDER_JOIN_REJECTIONS.TOO_MANY_ROOMS };

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

  // One query by the primary key: a foreign order and a missing one look and take the same.
  async isParticipant(data: AppSocketData, orderId: number): Promise<boolean> {
    const participant =
      data.role === ROLE.COURIER
        ? eq(orders.courierId, data.courierProfileId)
        : eq(orders.clientId, data.userId);
    const [order] = await this.db
      .select({ orderId: orders.orderId })
      .from(orders)
      .where(and(eq(orders.orderId, orderId), participant))
      .limit(SINGLE_ROW_LIMIT);

    return order !== undefined;
  }

  // The limit is checked again after the query: two joins sent at once both passed the first
  // check. A socket closed while the query ran is not put into the room.
  private async enterIfParticipant(
    socket: Socket,
    data: AppSocketData,
    orderId: number,
  ): Promise<OrderJoinAck> {
    let ack = JOINED;

    try {
      if (!(await this.isParticipant(data, orderId))) {
        ack = { ok: false, reason: ORDER_JOIN_REJECTIONS.NOT_FOUND };
      } else if (isRoomLimitReached(socket)) {
        ack = TOO_MANY_ROOMS;
      } else if (socket.connected) {
        await socket.join(orderRoom(orderId));
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
