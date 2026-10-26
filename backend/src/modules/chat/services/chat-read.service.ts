import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { orderParticipant, participantActor } from '../../../common/database/order-participant';
import type { RoleName } from '../../../common/enums/role.enum';
import { describeError } from '../../../common/utils/describe-error';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { CouriersGateway } from '../../couriers/gateways/couriers.gateway';
import { CHAT_ERROR_MESSAGES, CHAT_SOCKET_EVENTS } from '../constants/chat.constants';
import type { ChatReadResult, MessageReadEvent } from '../types/chat.types';
import { ChatUnreadService } from './chat-unread.service';

@Injectable()
export class ChatReadService {
  private readonly logger = new Logger(ChatReadService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly unread: ChatUnreadService,
    private readonly gateway: CouriersGateway,
  ) {}

  // Either side marks the messages to them, in any status of the order: a finished chat can still
  // be read. The room hears of it only when something was marked, with the largest marked id.
  async markRead(
    user: { role: RoleName; userId: number },
    orderId: number,
    upToMessageId: number,
  ): Promise<ChatReadResult> {
    const actor = participantActor(user.role, user.userId);
    const participant = actor && (await orderParticipant(this.db, orderId, actor));

    if (!actor || !participant) {
      throw new NotFoundException(CHAT_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    const marked = await this.unread.markRead(orderId, user.userId, upToMessageId);
    const unreadCount = await this.unread.count(orderId, user.userId);

    if (marked.length > 0) {
      this.publish({
        orderId,
        readerRole: actor.role,
        upToMessageId: marked.reduce((largest, id) => Math.max(largest, id)),
      });
    }

    return { readCount: marked.length, unreadCount };
  }

  // A room that cannot be told does not undo the marking: the other side sees it in the history.
  private publish(event: MessageReadEvent): void {
    try {
      this.gateway.emitToOrder(event.orderId, CHAT_SOCKET_EVENTS.MESSAGE_READ, event);
    } catch (error) {
      this.logger.error(
        `Reading of order ${event.orderId} up to message ${event.upToMessageId} not sent to the room: ${describeError(error)}`,
      );
    }
  }
}
