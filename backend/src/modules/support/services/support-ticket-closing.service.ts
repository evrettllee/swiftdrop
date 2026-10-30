import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { withLockConflict } from '@/common/database/lock-conflict';
import { findAccessibleTicket, type TicketActor } from '@/common/database/ticket-access';
import { SUPPORT_TICKET_STATUS } from '@/common/enums/support-ticket.enum';
import { supportTickets } from '@/database/schema';
import { SUPPORT_MESSAGES } from '../constants/support.constants';
import { TICKET_STATE_COLUMNS } from '../utils/support-ticket-query';
import { SupportMessageWriterService } from './support-message-writer.service';

@Injectable()
export class SupportTicketClosingService {
  constructor(private readonly writer: SupportMessageWriterService) {}

  async close(actor: TicketActor, ticketId: number): Promise<void> {
    await withLockConflict(
      () =>
        this.writer.run(async (supportTx) => {
          const ticket = await findAccessibleTicket(supportTx.tx, ticketId, actor, { lock: true });

          if (!ticket) {
            throw new NotFoundException(SUPPORT_MESSAGES.TICKET_NOT_FOUND);
          }

          if (ticket.status === SUPPORT_TICKET_STATUS.CLOSED) {
            return;
          }

          const [closed] = await supportTx.tx
            .update(supportTickets)
            .set({
              status: SUPPORT_TICKET_STATUS.CLOSED,
              closedAt: sql`now()`,
              closedBy: actor.userId,
              awaitingStaff: false,
            })
            .where(
              and(
                eq(supportTickets.ticketId, ticketId),
                eq(supportTickets.status, SUPPORT_TICKET_STATUS.OPEN),
              ),
            )
            .returning(TICKET_STATE_COLUMNS);

          this.writer.closed(supportTx, closed);
        }),
      SUPPORT_MESSAGES.BUSY,
    );
  }
}
