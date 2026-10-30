import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';
import {
  SINGLE_ROW_LIMIT,
  SUPPORT_TICKETS_ONE_OPEN_PER_ORDER_INDEX,
} from '@/common/constants/database.constants';
import { courierWasOnOrder } from '@/common/database/courier-order-involvement';
import { getUniqueViolationConstraint } from '@/common/database/pg-errors';
import { ROLE } from '@/common/enums/role.enum';
import { SUPPORT_TICKET_STATUS } from '@/common/enums/support-ticket.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { orders, supportTickets } from '@/database/schema';
import {
  SUPPORT_ERROR_CODE,
  SUPPORT_MESSAGES,
  TICKET_TOPICS_BY_ROLE,
} from '../constants/support.constants';
import type { CreateTicketDto } from '../dto/support.dto';
import type { SupportAuthor, TicketDetails } from '../types/support.types';
import { SupportMessageWriterService } from './support-message-writer.service';
import { SupportTicketsService } from './support-tickets.service';

export function isTopicAllowed(author: SupportAuthor, topic: CreateTicketDto['topic']): boolean {
  return TICKET_TOPICS_BY_ROLE[author.role].includes(topic);
}

@Injectable()
export class SupportTicketCreationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly writer: SupportMessageWriterService,
    private readonly tickets: SupportTicketsService,
  ) {}

  async create(author: SupportAuthor, dto: CreateTicketDto): Promise<TicketDetails> {
    if (!isTopicAllowed(author, dto.topic)) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: SUPPORT_MESSAGES.TOPIC_NOT_ALLOWED,
      });
    }

    const ticketId = await this.db
      .transaction((tx) => this.insert(tx, author, dto))
      .catch((error: unknown) => this.refuseDuplicate(error, author, dto.orderId));

    return this.tickets.get(author, ticketId);
  }

  private async insert(tx: Transaction, author: SupportAuthor, dto: CreateTicketDto) {
    if (dto.orderId !== null && !(await this.canUseOrder(tx, author, dto.orderId))) {
      throw new NotFoundException(SUPPORT_MESSAGES.ORDER_NOT_FOUND);
    }

    const [ticket] = await tx
      .insert(supportTickets)
      .values({
        userId: author.userId,
        orderId: dto.orderId,
        topic: dto.topic,
        subject: dto.subject,
      })
      .returning({ ticketId: supportTickets.ticketId });

    await this.writer.write(tx, {
      ticketId: ticket.ticketId,
      senderId: author.userId,
      text: dto.message,
      fromStaff: false,
    });

    return ticket.ticketId;
  }

  private async canUseOrder(tx: Transaction, author: SupportAuthor, orderId: number) {
    const access =
      author.role === ROLE.CLIENT
        ? eq(orders.clientId, author.userId)
        : courierWasOnOrder(tx, author.userId);
    const [row] = await tx
      .select({ orderId: orders.orderId })
      .from(orders)
      .where(and(eq(orders.orderId, orderId), access))
      .limit(SINGLE_ROW_LIMIT);

    return row !== undefined;
  }

  private async refuseDuplicate(
    error: unknown,
    author: SupportAuthor,
    orderId: number | null,
  ): Promise<never> {
    if (
      orderId === null ||
      getUniqueViolationConstraint(error) !== SUPPORT_TICKETS_ONE_OPEN_PER_ORDER_INDEX
    ) {
      throw error;
    }

    const [open] = await this.db
      .select({ ticketId: supportTickets.ticketId })
      .from(supportTickets)
      .where(
        and(
          eq(supportTickets.orderId, orderId),
          eq(supportTickets.userId, author.userId),
          ne(supportTickets.status, SUPPORT_TICKET_STATUS.CLOSED),
        ),
      )
      .limit(SINGLE_ROW_LIMIT);

    throw new ConflictException({
      statusCode: HttpStatus.CONFLICT,
      code: SUPPORT_ERROR_CODE.TICKET_ALREADY_OPEN,
      message: SUPPORT_MESSAGES.TICKET_ALREADY_OPEN,
      ticketId: open?.ticketId ?? null,
    });
  }
}
