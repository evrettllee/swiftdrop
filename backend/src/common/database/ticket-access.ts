import { and, eq } from 'drizzle-orm';
import { ROW_LOCK_NO_KEY_UPDATE, SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { ROLE, type RoleName } from '@/common/enums/role.enum';
import type { SupportTicketStatus } from '@/common/enums/support-ticket.enum';
import type { Database, Transaction } from '@/database/database.module';
import { supportTickets } from '@/database/schema';

export type TicketActor = { userId: number; role: RoleName };

export type AccessibleTicket = { ticketId: number; userId: number; status: SupportTicketStatus };

const TICKET_STAFF_ROLES = new Set<RoleName>([ROLE.MANAGER, ROLE.ADMIN]);
const TICKET_AUTHOR_ROLES = new Set<RoleName>([ROLE.CLIENT, ROLE.COURIER]);

export function isTicketStaff(role: RoleName): boolean {
  return TICKET_STAFF_ROLES.has(role);
}

export async function findAccessibleTicket(
  executor: Database | Transaction,
  ticketId: number,
  actor: TicketActor,
  options: { lock?: boolean } = {},
): Promise<AccessibleTicket | null> {
  const isStaff = isTicketStaff(actor.role);

  if (!isStaff && !TICKET_AUTHOR_ROLES.has(actor.role)) {
    return null;
  }

  const query = executor
    .select({
      ticketId: supportTickets.ticketId,
      userId: supportTickets.userId,
      status: supportTickets.status,
    })
    .from(supportTickets)
    .where(
      and(
        eq(supportTickets.ticketId, ticketId),
        isStaff ? undefined : eq(supportTickets.userId, actor.userId),
      ),
    )
    .limit(SINGLE_ROW_LIMIT);
  const [ticket] = await (options.lock ? query.for(ROW_LOCK_NO_KEY_UPDATE) : query);

  return ticket ?? null;
}
