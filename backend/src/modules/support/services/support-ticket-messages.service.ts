import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, max, type SQL, sql } from 'drizzle-orm';
import { withLockConflict } from '@/common/database/lock-conflict';
import { mapPageItems, paginate, type ListFetch } from '@/common/database/paginate';
import {
  type AccessibleTicket,
  findAccessibleTicket,
  isTicketStaff,
  type TicketActor,
} from '@/common/database/ticket-access';
import { SUPPORT_TICKET_STATUS } from '@/common/enums/support-ticket.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { messages, users } from '@/database/schema';
import { SUPPORT_MESSAGES } from '../constants/support.constants';
import type { TicketMessagesDto } from '../dto/support.dto';
import { toTicketMessage } from '../mappers/support.mapper';
import type { TicketMessage, TicketMessagesPage, TicketReadResult } from '../types/support.types';
import { readerOf, ticketClosedError, unreadFor, viewerOf } from '../utils/support-message-rules';
import { TICKET_MESSAGES_SORT } from '../utils/support-sort';
import { SupportEventsService } from './support-events.service';
import { SupportMessageWriterService } from './support-message-writer.service';

@Injectable()
export class SupportTicketMessagesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly writer: SupportMessageWriterService,
    private readonly events: SupportEventsService,
  ) {}

  async list(
    actor: TicketActor,
    ticketId: number,
    query: TicketMessagesDto,
  ): Promise<TicketMessagesPage> {
    const ticket = await this.findOrFail(this.db, actor, ticketId);
    const page = await paginate(query, {
      whitelist: TICKET_MESSAGES_SORT.whitelist,
      idColumn: messages.messageId,
      where: eq(messages.ticketId, ticketId),
      fetch: (options) => this.fetch(options),
      count: (condition) => this.db.$count(messages, condition),
      maxId: (condition) => this.maxId(condition),
      idOf: (row) => row.messageId,
    });

    return mapPageItems(page, (row) => toTicketMessage(row, ticket.userId, viewerOf(actor)));
  }

  async send(actor: TicketActor, ticketId: number, text: string): Promise<TicketMessage> {
    const { row, authorId } = await withLockConflict(
      () =>
        this.writer.run(async (supportTx) => {
          const ticket = await this.findOrFail(supportTx.tx, actor, ticketId, true);

          if (ticket.status === SUPPORT_TICKET_STATUS.CLOSED) {
            throw ticketClosedError();
          }

          const written = await this.writer.write(supportTx, {
            ticketId,
            senderId: actor.userId,
            text,
            fromStaff: isTicketStaff(actor.role),
          });

          return { row: written, authorId: ticket.userId };
        }),
      SUPPORT_MESSAGES.BUSY,
    );

    return toTicketMessage(row, authorId, viewerOf(actor));
  }

  async markRead(actor: TicketActor, ticketId: number): Promise<TicketReadResult> {
    const ticket = await this.findOrFail(this.db, actor, ticketId);
    const marked = await this.db
      .update(messages)
      .set({ isRead: true })
      .where(and(unreadFor(actor, ticket), sql`${messages.sentAt} <= now()`))
      .returning({ messageId: messages.messageId });
    const unreadCount = await this.db.$count(messages, unreadFor(actor, ticket));

    if (marked.length > 0) {
      this.events.read(ticketId, readerOf(actor));
    }

    return { readCount: marked.length, unreadCount };
  }

  private async findOrFail(
    executor: Database | Transaction,
    actor: TicketActor,
    ticketId: number,
    lock = false,
  ): Promise<AccessibleTicket> {
    const ticket = await findAccessibleTicket(executor, ticketId, actor, { lock });

    if (!ticket) {
      throw new NotFoundException(SUPPORT_MESSAGES.TICKET_NOT_FOUND);
    }

    return ticket;
  }

  private fetch({ where, orderBy, limit, offset, sortValue }: ListFetch) {
    return this.db
      .select({
        messageId: messages.messageId,
        senderId: messages.senderId,
        content: messages.content,
        sentAt: messages.sentAt,
        isRead: messages.isRead,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        sortValue,
      })
      .from(messages)
      .innerJoin(users, eq(users.userId, messages.senderId))
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);
  }

  private async maxId(where: SQL | undefined): Promise<number | null> {
    const [row] = await this.db
      .select({ maxId: max(messages.messageId) })
      .from(messages)
      .where(where);

    return row?.maxId ?? null;
  }
}
