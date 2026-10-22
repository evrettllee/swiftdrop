import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, lt } from 'drizzle-orm';
import { orderParticipant, participantActor } from '../../../common/database/order-participant';
import type { RoleName } from '../../../common/enums/role.enum';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { messages } from '../../../database/schema';
import { CHAT_ERROR_MESSAGES } from '../constants/chat.constants';
import type { ChatHistoryDto } from '../dto/chat-history.dto';
import { canSendInOrder, toChatHistoryPage } from '../mappers/chat-message.mapper';
import type { ChatHistory, ChatMessageRow } from '../types/chat.types';
import { ChatUnreadService } from './chat-unread.service';

@Injectable()
export class ChatHistoryService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly unread: ChatUnreadService,
  ) {}

  // Only the owner of the order and its assigned courier read the chat; anyone else gets the
  // answer of a missing order. The history and the counter run together after the check.
  async list(
    user: { role: RoleName; userId: number },
    orderId: number,
    query: ChatHistoryDto,
  ): Promise<ChatHistory> {
    const actor = participantActor(user.role, user.userId);
    const participant = actor && (await orderParticipant(this.db, orderId, actor));

    if (!participant) {
      throw new NotFoundException(CHAT_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    const [rows, unreadCount] = await Promise.all([
      this.readPage(orderId, query),
      this.unread.count(orderId, user.userId),
    ]);

    return {
      ...toChatHistoryPage(rows, query.limit, participant.clientUserId),
      unreadCount,
      canSend: canSendInOrder(participant.status, participant.counterpartUserId !== null),
    };
  }

  // Keyset pagination by messages_order_id_message_id_idx: one row more than the page tells
  // whether an older page exists.
  private readPage(
    orderId: number,
    { beforeId, limit }: ChatHistoryDto,
  ): Promise<ChatMessageRow[]> {
    return this.db
      .select({
        messageId: messages.messageId,
        senderId: messages.senderId,
        content: messages.content,
        sentAt: messages.sentAt,
        isRead: messages.isRead,
      })
      .from(messages)
      .where(
        and(
          eq(messages.orderId, orderId),
          beforeId === undefined ? undefined : lt(messages.messageId, beforeId),
        ),
      )
      .orderBy(desc(messages.messageId))
      .limit(limit + 1);
  }
}
