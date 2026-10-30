import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, max, type SQL, sql } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { mapPageItems, paginate, type ListFetch } from '@/common/database/paginate';
import { SUPPORT_TICKET_STATUS } from '@/common/enums/support-ticket.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { supportTickets } from '@/database/schema';
import { SUPPORT_MESSAGES } from '../constants/support.constants';
import type { ListTicketsDto } from '../dto/support.dto';
import { toTicketDetails, toTicketListItem } from '../mappers/support.mapper';
import type { SupportAuthor, TicketDetails, TicketsPage } from '../types/support.types';
import { TICKETS_SORT } from '../utils/support-sort';
import { ownTicket, ticketDetailsRows, ticketListRows } from '../utils/support-ticket-query';

@Injectable()
export class SupportTicketsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(author: SupportAuthor, query: ListTicketsDto): Promise<TicketsPage> {
    const where = and(
      eq(supportTickets.userId, author.userId),
      query.status === null ? undefined : eq(supportTickets.status, query.status),
    );
    const page = await paginate(query, {
      whitelist: TICKETS_SORT.whitelist,
      idColumn: supportTickets.ticketId,
      where,
      fetch: (options) => this.fetch(options),
      count: (condition) => this.db.$count(supportTickets, condition),
      maxId: (condition) => this.maxId(condition),
      idOf: (row) => row.ticketId,
    });

    return mapPageItems(page, toTicketListItem);
  }

  async get(author: SupportAuthor, ticketId: number): Promise<TicketDetails> {
    const [row] = await ticketDetailsRows(this.db)
      .where(ownTicket(author.userId, ticketId))
      .limit(SINGLE_ROW_LIMIT);

    if (!row) {
      throw new NotFoundException(SUPPORT_MESSAGES.TICKET_NOT_FOUND);
    }

    return toTicketDetails(row);
  }

  async close(author: SupportAuthor, ticketId: number): Promise<TicketDetails> {
    await this.db
      .update(supportTickets)
      .set({
        status: SUPPORT_TICKET_STATUS.CLOSED,
        closedAt: sql`now()`,
        closedBy: author.userId,
        awaitingStaff: false,
      })
      .where(
        and(
          ownTicket(author.userId, ticketId),
          eq(supportTickets.status, SUPPORT_TICKET_STATUS.OPEN),
        ),
      );

    return this.get(author, ticketId);
  }

  private fetch({ where, orderBy, limit, offset, sortValue }: ListFetch) {
    return ticketListRows(this.db, sortValue)
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);
  }

  private async maxId(where: SQL | undefined): Promise<number | null> {
    const [row] = await this.db
      .select({ maxId: max(supportTickets.ticketId) })
      .from(supportTickets)
      .where(where);

    return row?.maxId ?? null;
  }
}
