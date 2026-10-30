import { and, eq, gte, ilike, inArray, lt, or, type SQL, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { SUPPORT_TICKET_STATUS } from '@/common/enums/support-ticket.enum';
import type { DateRange } from '@/common/utils/date-range';
import type { Database } from '@/database/database.module';
import { fullNameSql } from '@/database/sql-expressions';
import { addresses, orders, roles, supportTickets, users } from '@/database/schema';
import type { OrderSearch } from '@/modules/manager/types/manager-orders.types';
import { SUPPORT_VIEW, type SupportView } from '../constants/support-staff.constants';
import type { StaffTicketFilters } from '../dto/support-staff.dto';
import { lastMessageOf, ticketFields } from './support-ticket-query';

const isOpen = eq(supportTickets.status, SUPPORT_TICKET_STATUS.OPEN);

export function viewCondition(view: SupportView): SQL | undefined {
  if (view === SUPPORT_VIEW.AWAITING) {
    return and(isOpen, eq(supportTickets.awaitingStaff, true));
  }

  return view === SUPPORT_VIEW.OPEN
    ? isOpen
    : eq(supportTickets.status, SUPPORT_TICKET_STATUS.CLOSED);
}

export function ticketSearchCondition(search: OrderSearch | null): SQL | undefined {
  if (search === null) {
    return undefined;
  }

  if (search.kind === 'text') {
    return ilike(fullNameSql(users.firstName, users.lastName), search.pattern);
  }

  return (
    or(
      ...(search.orderId === null
        ? []
        : [
            eq(supportTickets.ticketId, search.orderId),
            eq(supportTickets.orderId, search.orderId),
          ]),
      ...(search.phone === null ? [] : [eq(users.phone, search.phone)]),
    ) ?? sql`false`
  );
}

function periodCondition({ start, end }: DateRange): SQL | undefined {
  return and(
    start === null ? undefined : gte(supportTickets.createdAt, start),
    end === null ? undefined : lt(supportTickets.createdAt, end),
  );
}

export function staffTicketsCondition(filters: StaffTicketFilters, period: DateRange) {
  return and(
    viewCondition(filters.view),
    filters.topics === null ? undefined : inArray(supportTickets.topic, filters.topics),
    filters.authorRole === null ? undefined : eq(roles.name, filters.authorRole),
    ticketSearchCondition(filters.search),
    periodCondition(period),
  );
}

const waitingSec = sql<number | null>`case
  when ${supportTickets.status} = ${SUPPORT_TICKET_STATUS.OPEN} and ${supportTickets.awaitingStaff}
    then floor(extract(epoch from now() - ${supportTickets.lastMessageAt}))::int
  end`;

export function staffTicketRows(db: Database, sortValue: SQL<string>) {
  const last = lastMessageOf(db);

  return db
    .select({ ...ticketFields(last), ...authorColumns(), sortValue })
    .from(supportTickets)
    .innerJoin(users, eq(users.userId, supportTickets.userId))
    .innerJoin(roles, eq(roles.roleId, users.roleId))
    .leftJoin(orders, eq(orders.orderId, supportTickets.orderId))
    .leftJoinLateral(last, sql`true`);
}

function authorColumns() {
  return {
    waitingSec: waitingSec.as('waiting_sec'),
    authorFirstName: users.firstName,
    authorLastName: users.lastName,
    authorRole: roles.name,
  };
}

export function staffTicketsCount(db: Database, where: SQL | undefined) {
  return db
    .select({ total: sql<number>`count(*)::int` })
    .from(supportTickets)
    .innerJoin(users, eq(users.userId, supportTickets.userId))
    .innerJoin(roles, eq(roles.roleId, users.roleId))
    .where(where);
}

export function staffTicketDetailsRows(db: Database) {
  const last = lastMessageOf(db);
  const delivery = alias(addresses, 'delivery');
  const closer = alias(users, 'closer');

  return db
    .select({
      ...ticketFields(last),
      ...authorColumns(),
      authorPhone: users.phone,
      closedById: supportTickets.closedBy,
      closerFirstName: closer.firstName,
      closerLastName: closer.lastName,
      delivery: {
        city: delivery.city,
        street: delivery.street,
        house: delivery.house,
        apartment: delivery.apartment,
      },
    })
    .from(supportTickets)
    .innerJoin(users, eq(users.userId, supportTickets.userId))
    .innerJoin(roles, eq(roles.roleId, users.roleId))
    .leftJoin(orders, eq(orders.orderId, supportTickets.orderId))
    .leftJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
    .leftJoin(closer, eq(closer.userId, supportTickets.closedBy))
    .leftJoinLateral(last, sql`true`);
}

export function supportCountsQuery(db: Database) {
  return db
    .select({
      awaiting: sql<number>`(count(*) filter (where ${supportTickets.awaitingStaff}))::int`,
      open: sql<number>`count(*)::int`,
    })
    .from(supportTickets)
    .where(isOpen);
}
