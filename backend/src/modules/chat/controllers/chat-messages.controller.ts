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
import { type OrderIdParamDto, orderIdParamSchema } from '@/modules/orders/dto/order-id-param.dto';
import { CHAT_ROUTES } from '../constants/chat.constants';
import { type ChatHistoryDto, chatHistorySchema } from '../dto/chat-history.dto';
import { type MarkReadDto, markReadSchema } from '../dto/mark-read.dto';
import { type SendMessageDto, sendMessageSchema } from '../dto/send-message.dto';
import { ChatSendThrottleGuard } from '../guards/chat-send-throttle.guard';
import { ChatHistoryService } from '../services/chat-history.service';
import { ChatReadService } from '../services/chat-read.service';
import { ChatSendService } from '../services/chat-send.service';
import type { ChatHistory, ChatReadResult, SentChatMessage } from '../types/chat.types';

// The roles are checked on each route; the role of the user picks how the order is matched.
@Controller(CHAT_ROUTES.BASE)
export class ChatMessagesController {
  constructor(
    private readonly history: ChatHistoryService,
    private readonly sending: ChatSendService,
    private readonly reading: ChatReadService,
  ) {}

  @Get(CHAT_ROUTES.MESSAGES)
  @Roles(ROLE.CLIENT, ROLE.COURIER)
  list(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
    @Query(new ZodValidationPipe(chatHistorySchema)) query: ChatHistoryDto,
  ): Promise<ChatHistory> {
    return this.history.list(user, params.orderId, query);
  }

  // The CSRF header is checked by the global guard, as for every POST.
  @Post(CHAT_ROUTES.MESSAGES)
  @Roles(ROLE.CLIENT, ROLE.COURIER)
  @UseGuards(ChatSendThrottleGuard)
  send(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
    @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto,
  ): Promise<SentChatMessage> {
    return this.sending.send(user, params.orderId, dto.content);
  }

  // Only the general throttler of the app limits it: marking changes nothing a second time.
  @Post(CHAT_ROUTES.READ)
  @HttpCode(HttpStatus.OK)
  @Roles(ROLE.CLIENT, ROLE.COURIER)
  markRead(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
    @Body(new ZodValidationPipe(markReadSchema)) dto: MarkReadDto,
  ): Promise<ChatReadResult> {
    return this.reading.markRead(user, params.orderId, dto.upToMessageId);
  }
}
