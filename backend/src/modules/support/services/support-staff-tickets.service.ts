import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, max, type SQL } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { mapPageItems, paginate, type ListFetch } from '@/common/database/paginate';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { roles, supportTickets, users } from '@/database/schema';
import { SUPPORT_MESSAGES } from '../constants/support.constants';
import type { StaffTicketsDto } from '../dto/support-staff.dto';
import { toStaffTicketDetails, toStaffTicketItem } from '../mappers/support-staff.mapper';
import type { StaffTicketDetails, StaffTicketsPage, SupportCounts } from '../types/support.types';
import { TICKETS_SORT } from '../utils/support-sort';
import {
  staffTicketDetailsRows,
  staffTicketRows,
  staffTicketsCondition,
  staffTicketsCount,
  supportCountsQuery,
} from '../utils/support-staff-query';

@Injectable()
export class SupportStaffTicketsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(query: StaffTicketsDto): Promise<StaffTicketsPage> {
    const page = await paginate(query, {
      whitelist: TICKETS_SORT.whitelist,
      idColumn: supportTickets.ticketId,
      where: staffTicketsCondition(query.filters, query.period),
      fetch: (options) => this.fetch(options),
      count: async (where) => (await staffTicketsCount(this.db, where))[0]?.total ?? 0,
      maxId: (where) => this.maxId(where),
      idOf: (row) => row.ticketId,
    });

    return mapPageItems(page, toStaffTicketItem);
  }

  async counts(): Promise<SupportCounts> {
    const [row] = await supportCountsQuery(this.db);

    return { awaiting: row?.awaiting ?? 0, open: row?.open ?? 0 };
  }

  async get(ticketId: number): Promise<StaffTicketDetails> {
    const [row] = await staffTicketDetailsRows(this.db)
      .where(eq(supportTickets.ticketId, ticketId))
      .limit(SINGLE_ROW_LIMIT);

    if (!row) {
      throw new NotFoundException(SUPPORT_MESSAGES.TICKET_NOT_FOUND);
    }

    return toStaffTicketDetails(row);
  }

  private fetch({ where, orderBy, limit, offset, sortValue }: ListFetch) {
    return staffTicketRows(this.db, sortValue)
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);
  }

  private async maxId(where: SQL | undefined): Promise<number | null> {
    const [row] = await this.db
      .select({ maxId: max(supportTickets.ticketId) })
      .from(supportTickets)
      .innerJoin(users, eq(users.userId, supportTickets.userId))
      .innerJoin(roles, eq(roles.roleId, users.roleId))
      .where(where);

    return row?.maxId ?? null;
  }
}
