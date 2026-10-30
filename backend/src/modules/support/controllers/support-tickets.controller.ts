import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import { SUPPORT_AUTHOR_ROLES, SUPPORT_ROUTES } from '../constants/support.constants';
import {
  type CreateTicketDto,
  createTicketSchema,
  type ListTicketsDto,
  listTicketsSchema,
  type SendTicketMessageDto,
  sendTicketMessageSchema,
  type TicketIdParamDto,
  ticketIdParamSchema,
  type TicketMessagesDto,
  ticketMessagesSchema,
} from '../dto/support.dto';
import {
  SupportMessageThrottleGuard,
  SupportTicketCreateThrottleGuard,
} from '../guards/support-throttle.guards';
import { SupportTicketCreationService } from '../services/support-ticket-creation.service';
import { SupportTicketMessagesService } from '../services/support-ticket-messages.service';
import { SupportTicketsService } from '../services/support-tickets.service';
import type {
  SupportAuthor,
  TicketDetails,
  TicketMessage,
  TicketMessagesPage,
  TicketReadResult,
  TicketsPage,
} from '../types/support.types';

const ticketParam = new ZodValidationPipe(ticketIdParamSchema);

function authorOf(user: AuthUser): SupportAuthor {
  const role = SUPPORT_AUTHOR_ROLES.find((allowed) => allowed === user.role);

  if (role === undefined) {
    throw new ForbiddenException();
  }

  return { userId: user.userId, role };
}

@Controller(SUPPORT_ROUTES.BASE)
@Roles(ROLE.CLIENT, ROLE.COURIER)
export class SupportTicketsController {
  constructor(
    private readonly tickets: SupportTicketsService,
    private readonly creation: SupportTicketCreationService,
    private readonly ticketMessages: SupportTicketMessagesService,
  ) {}

  @Post()
  @UseGuards(SupportTicketCreateThrottleGuard)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTicketSchema)) dto: CreateTicketDto,
  ): Promise<TicketDetails> {
    return this.creation.create(authorOf(user), dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listTicketsSchema)) query: ListTicketsDto,
  ): Promise<TicketsPage> {
    return this.tickets.list(authorOf(user), query);
  }

  @Get(SUPPORT_ROUTES.TICKET)
  get(
    @CurrentUser() user: AuthUser,
    @Param(ticketParam) params: TicketIdParamDto,
  ): Promise<TicketDetails> {
    return this.tickets.get(authorOf(user), params.ticketId);
  }

  @Get(SUPPORT_ROUTES.MESSAGES)
  messages(
    @CurrentUser() user: AuthUser,
    @Param(ticketParam) params: TicketIdParamDto,
    @Query(new ZodValidationPipe(ticketMessagesSchema)) query: TicketMessagesDto,
  ): Promise<TicketMessagesPage> {
    return this.ticketMessages.list(authorOf(user), params.ticketId, query);
  }

  @Post(SUPPORT_ROUTES.MESSAGES)
  @UseGuards(SupportMessageThrottleGuard)
  async send(
    @CurrentUser() user: AuthUser,
    @Param(ticketParam) params: TicketIdParamDto,
    @Body(new ZodValidationPipe(sendTicketMessageSchema)) dto: SendTicketMessageDto,
  ): Promise<{ message: TicketMessage }> {
    return { message: await this.ticketMessages.send(authorOf(user), params.ticketId, dto.text) };
  }

  @Post(SUPPORT_ROUTES.READ)
  @HttpCode(HttpStatus.OK)
  markRead(
    @CurrentUser() user: AuthUser,
    @Param(ticketParam) params: TicketIdParamDto,
  ): Promise<TicketReadResult> {
    return this.ticketMessages.markRead(authorOf(user), params.ticketId);
  }

  @Post(SUPPORT_ROUTES.CLOSE)
  @HttpCode(HttpStatus.OK)
  close(
    @CurrentUser() user: AuthUser,
    @Param(ticketParam) params: TicketIdParamDto,
  ): Promise<TicketDetails> {
    return this.tickets.close(authorOf(user), params.ticketId);
  }
}
