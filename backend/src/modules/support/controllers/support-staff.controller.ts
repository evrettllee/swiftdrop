import {
  Body,
  Controller,
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
import { SUPPORT_STAFF_ROUTES } from '../constants/support-staff.constants';
import { type StaffTicketsDto, staffTicketsSchema } from '../dto/support-staff.dto';
import {
  type SendTicketMessageDto,
  sendTicketMessageSchema,
  type TicketIdParamDto,
  ticketIdParamSchema,
  type TicketMessagesDto,
  ticketMessagesSchema,
} from '../dto/support.dto';
import { SupportStaffMessageThrottleGuard } from '../guards/support-throttle.guards';
import { SupportStaffTicketsService } from '../services/support-staff-tickets.service';
import { SupportTicketClosingService } from '../services/support-ticket-closing.service';
import { SupportTicketMessagesService } from '../services/support-ticket-messages.service';
import type {
  StaffTicketDetails,
  StaffTicketsPage,
  SupportCounts,
  TicketMessage,
  TicketMessagesPage,
  TicketReadResult,
} from '../types/support.types';

const ticketParam = new ZodValidationPipe(ticketIdParamSchema);

@Controller(SUPPORT_STAFF_ROUTES.BASE)
@Roles(ROLE.MANAGER, ROLE.ADMIN)
export class SupportStaffController {
  constructor(
    private readonly tickets: SupportStaffTicketsService,
    private readonly ticketMessages: SupportTicketMessagesService,
    private readonly closing: SupportTicketClosingService,
  ) {}

  @Get(SUPPORT_STAFF_ROUTES.TICKETS)
  list(
    @Query(new ZodValidationPipe(staffTicketsSchema)) query: StaffTicketsDto,
  ): Promise<StaffTicketsPage> {
    return this.tickets.list(query);
  }

  @Get(SUPPORT_STAFF_ROUTES.COUNTS)
  counts(): Promise<SupportCounts> {
    return this.tickets.counts();
  }

  @Get(SUPPORT_STAFF_ROUTES.TICKET)
  get(@Param(ticketParam) params: TicketIdParamDto): Promise<StaffTicketDetails> {
    return this.tickets.get(params.ticketId);
  }

  @Get(SUPPORT_STAFF_ROUTES.MESSAGES)
  messages(
    @CurrentUser() user: AuthUser,
    @Param(ticketParam) params: TicketIdParamDto,
    @Query(new ZodValidationPipe(ticketMessagesSchema)) query: TicketMessagesDto,
  ): Promise<TicketMessagesPage> {
    return this.ticketMessages.list(user, params.ticketId, query);
  }

  @Post(SUPPORT_STAFF_ROUTES.MESSAGES)
  @UseGuards(SupportStaffMessageThrottleGuard)
  async send(
    @CurrentUser() user: AuthUser,
    @Param(ticketParam) params: TicketIdParamDto,
    @Body(new ZodValidationPipe(sendTicketMessageSchema)) dto: SendTicketMessageDto,
  ): Promise<{ message: TicketMessage }> {
    return { message: await this.ticketMessages.send(user, params.ticketId, dto.text) };
  }

  @Post(SUPPORT_STAFF_ROUTES.READ)
  @HttpCode(HttpStatus.OK)
  markRead(
    @CurrentUser() user: AuthUser,
    @Param(ticketParam) params: TicketIdParamDto,
  ): Promise<TicketReadResult> {
    return this.ticketMessages.markRead(user, params.ticketId);
  }

  @Post(SUPPORT_STAFF_ROUTES.CLOSE)
  @HttpCode(HttpStatus.OK)
  async close(
    @CurrentUser() user: AuthUser,
    @Param(ticketParam) params: TicketIdParamDto,
  ): Promise<StaffTicketDetails> {
    await this.closing.close(user, params.ticketId);

    return this.tickets.get(params.ticketId);
  }
}
