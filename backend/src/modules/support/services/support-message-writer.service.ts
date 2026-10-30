import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Transaction } from '@/database/database.module';
import { messages, supportTickets } from '@/database/schema';
import type { TicketMessageInput, WrittenTicketMessage } from '../types/support.types';

@Injectable()
export class SupportMessageWriterService {
  async write(tx: Transaction, input: TicketMessageInput): Promise<WrittenTicketMessage> {
    const [message] = await tx
      .insert(messages)
      .values({
        ticketId: input.ticketId,
        senderId: input.senderId,
        receiverId: null,
        content: input.text,
      })
      .returning({ messageId: messages.messageId, sentAt: messages.sentAt });

    await tx
      .update(supportTickets)
      .set({ lastMessageAt: message.sentAt, awaitingStaff: !input.fromStaff })
      .where(eq(supportTickets.ticketId, input.ticketId));

    return message;
  }
}
