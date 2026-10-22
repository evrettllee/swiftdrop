import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { messages } from '../../../database/schema';

// Written as in the predicate of messages_unread_idx, so the counter and the marking can use that
// index. A literal, not a parameter: the planner proves that a query fits a partial index from the
// query text, and with `is_read = $3` a generic plan cannot know the value is false and would skip
// the index.
const UNREAD = sql`${messages.isRead} = false`;

// Unread messages of one receiver in one order: the history counts them, the receiver marks them.
@Injectable()
export class ChatUnreadService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async count(orderId: number, receiverId: number): Promise<number> {
    const [row] = await this.db
      .select({ unread: count() })
      .from(messages)
      .where(and(eq(messages.receiverId, receiverId), eq(messages.orderId, orderId), UNREAD));

    return row?.unread ?? 0;
  }

  // Marks the messages to the receiver up to the given id and gives the ids it marked. Only rows
  // still unread change: a second marking of the same range, at once or later, marks nothing.
  async markRead(orderId: number, receiverId: number, upToMessageId: number): Promise<number[]> {
    const rows = await this.db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.orderId, orderId),
          eq(messages.receiverId, receiverId),
          UNREAD,
          lte(messages.messageId, upToMessageId),
        ),
      )
      .returning({ messageId: messages.messageId });

    return rows.map(({ messageId }) => messageId);
  }
}
