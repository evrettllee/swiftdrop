import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { orderParticipant, participantActor } from '@/common/database/order-participant';
import type { RoleName } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import { CHAT_ERROR_MESSAGES } from '../constants/chat.constants';
import type { ChatReadResult, MessageReadEvent } from '../types/chat.types';
import { ChatUnreadService } from './chat-unread.service';

@Injectable()
export class ChatReadService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly unread: ChatUnreadService,
    private readonly events: RealtimeEventsService,
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
    this.events.toOrder(event.orderId, SOCKET_EVENTS.MESSAGE_READ, event);
  }
}
