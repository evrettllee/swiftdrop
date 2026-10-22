import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, lt, sql } from 'drizzle-orm';
import { orderParticipant, participantActor } from '../../../common/database/order-participant';
import type { RoleName } from '../../../common/enums/role.enum';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { messages } from '../../../database/schema';
import { CHAT_ERROR_MESSAGES } from '../constants/chat.constants';
import type { ChatHistoryDto } from '../dto/chat-history.dto';
import { canSendInOrder, toChatHistoryPage } from '../mappers/chat-message.mapper';
import type { ChatHistory, ChatMessageRow } from '../types/chat.types';

// Written as in the predicate of messages_unread_idx, so the counter can use that index. A literal,
// not a parameter: the planner proves that a query fits a partial index from the query text, and
// with `is_read = $3` a generic plan cannot know the value is false and would skip the index.
const UNREAD = sql`${messages.isRead} = false`;

@Injectable()
export class ChatHistoryService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

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
      this.countUnread(orderId, user.userId),
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

  private async countUnread(orderId: number, receiverId: number): Promise<number> {
    const [row] = await this.db
      .select({ unread: count() })
      .from(messages)
      .where(and(eq(messages.receiverId, receiverId), eq(messages.orderId, orderId), UNREAD));

    return row?.unread ?? 0;
  }
}
