import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, max, type SQL, sql } from 'drizzle-orm';
import { ROW_LOCK_NO_KEY_UPDATE, SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { withLockConflict } from '@/common/database/lock-conflict';
import { mapPageItems, paginate, type ListFetch } from '@/common/database/paginate';
import { SUPPORT_TICKET_STATUS } from '@/common/enums/support-ticket.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { messages, supportTickets, users } from '@/database/schema';
import { SUPPORT_ERROR_CODE, SUPPORT_MESSAGES } from '../constants/support.constants';
import type { TicketMessagesDto } from '../dto/support.dto';
import { toTicketMessage } from '../mappers/support.mapper';
import type {
  SupportAuthor,
  TicketMessage,
  TicketMessagesPage,
  TicketReadResult,
} from '../types/support.types';
import { TICKET_MESSAGES_SORT } from '../utils/support-sort';
import { ownTicket, staffMessageCondition } from '../utils/support-ticket-query';
import { SupportMessageWriterService } from './support-message-writer.service';

const UNREAD_FROM_STAFF = and(staffMessageCondition(), eq(messages.isRead, false));

@Injectable()
export class SupportTicketMessagesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly writer: SupportMessageWriterService,
  ) {}

  async list(
    author: SupportAuthor,
    ticketId: number,
    query: TicketMessagesDto,
  ): Promise<TicketMessagesPage> {
    await this.findOwn(this.db, author, ticketId);
    const page = await paginate(query, {
      whitelist: TICKET_MESSAGES_SORT.whitelist,
      idColumn: messages.messageId,
      where: eq(messages.ticketId, ticketId),
      fetch: (options) => this.fetch(options),
      count: (condition) => this.db.$count(messages, condition),
      maxId: (condition) => this.maxId(condition),
      idOf: (row) => row.messageId,
    });

    return mapPageItems(page, (row) => toTicketMessage(row, author.userId));
  }

  async send(author: SupportAuthor, ticketId: number, text: string): Promise<TicketMessage> {
    const written = await withLockConflict(
      () =>
        this.db.transaction(async (tx) => {
          const ticket = await this.findOwn(tx, author, ticketId, true);

          if (ticket.status === SUPPORT_TICKET_STATUS.CLOSED) {
            throw new ConflictException({
              statusCode: HttpStatus.CONFLICT,
              code: SUPPORT_ERROR_CODE.TICKET_CLOSED,
              message: SUPPORT_MESSAGES.TICKET_CLOSED,
            });
          }

          return this.writer.write(tx, {
            ticketId,
            senderId: author.userId,
            text,
            fromStaff: false,
          });
        }),
      SUPPORT_MESSAGES.BUSY,
    );
    const [row] = await this.rows().where(eq(messages.messageId, written.messageId));

    return toTicketMessage(row, author.userId);
  }

  async markRead(author: SupportAuthor, ticketId: number): Promise<TicketReadResult> {
    await this.findOwn(this.db, author, ticketId);
    const inTicket = sql`${messages.ticketId} = ${ticketId} and ${supportTickets.ticketId} = ${ticketId}`;
    const marked = await this.db
      .update(messages)
      .set({ isRead: true })
      .from(supportTickets)
      .where(and(inTicket, UNREAD_FROM_STAFF, sql`${messages.sentAt} <= now()`))
      .returning({ messageId: messages.messageId });
    const [unread] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(messages)
      .innerJoin(supportTickets, eq(supportTickets.ticketId, messages.ticketId))
      .where(and(eq(messages.ticketId, ticketId), UNREAD_FROM_STAFF));

    return { readCount: marked.length, unreadCount: unread?.total ?? 0 };
  }

  private async findOwn(
    executor: Database | Transaction,
    author: SupportAuthor,
    ticketId: number,
    lock = false,
  ) {
    const query = executor
      .select({ status: supportTickets.status })
      .from(supportTickets)
      .where(ownTicket(author.userId, ticketId))
      .limit(SINGLE_ROW_LIMIT);
    const [ticket] = await (lock ? query.for(ROW_LOCK_NO_KEY_UPDATE) : query);

    if (!ticket) {
      throw new NotFoundException(SUPPORT_MESSAGES.TICKET_NOT_FOUND);
    }

    return ticket;
  }

  private rows(sortValue: SQL<string> = sql<string>`''`) {
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
      .innerJoin(users, eq(users.userId, messages.senderId));
  }

  private fetch({ where, orderBy, limit, offset, sortValue }: ListFetch) {
    return this.rows(sortValue)
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
