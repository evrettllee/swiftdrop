import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { messages, supportTickets, users } from '@/database/schema';
import type {
  SupportTicketState,
  SupportTransaction,
  TicketMessageInput,
  TicketMessageRow,
} from '../types/support.types';
import { TICKET_STATE_COLUMNS } from '../utils/support-ticket-query';
import { SupportEventsService } from './support-events.service';

@Injectable()
export class SupportMessageWriterService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly events: SupportEventsService,
  ) {}

  async run<T>(work: (supportTx: SupportTransaction) => Promise<T>): Promise<T> {
    const pending: SupportTransaction['pending'] = [];
    const result = await this.db.transaction((tx) => work({ tx, pending }));

    this.events.publish(pending);

    return result;
  }

  async write(supportTx: SupportTransaction, input: TicketMessageInput): Promise<TicketMessageRow> {
    const { tx } = supportTx;
    const [message] = await tx
      .insert(messages)
      .values({
        ticketId: input.ticketId,
        senderId: input.senderId,
        receiverId: null,
        content: input.text,
      })
      .returning({
        messageId: messages.messageId,
        senderId: messages.senderId,
        content: messages.content,
        sentAt: messages.sentAt,
        isRead: messages.isRead,
      });
    const [ticket] = await tx
      .update(supportTickets)
      .set({ lastMessageAt: message.sentAt, awaitingStaff: !input.fromStaff })
      .where(eq(supportTickets.ticketId, input.ticketId))
      .returning(TICKET_STATE_COLUMNS);
    const [sender] = await tx
      .select({ senderFirstName: users.firstName, senderLastName: users.lastName })
      .from(users)
      .where(eq(users.userId, input.senderId))
      .limit(SINGLE_ROW_LIMIT);
    const row = { ...message, ...sender };

    supportTx.pending.push({ kind: 'message', ticket, message: row, fromStaff: input.fromStaff });

    return row;
  }

  created(supportTx: SupportTransaction, ticket: SupportTicketState): void {
    supportTx.pending.push({ kind: 'created', ticket });
  }

  closed(supportTx: SupportTransaction, ticket: SupportTicketState): void {
    supportTx.pending.push({ kind: 'closed', ticket });
  }
}
