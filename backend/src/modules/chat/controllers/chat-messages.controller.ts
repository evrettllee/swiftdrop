import { Controller, Get, Param, Query } from '@nestjs/common';
import { ROLE } from '../../../common/enums/role.enum';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth.types';
import { type OrderIdParamDto, orderIdParamSchema } from '../../orders/dto/order-id-param.dto';
import { CHAT_ROUTES } from '../constants/chat.constants';
import { type ChatHistoryDto, chatHistorySchema } from '../dto/chat-history.dto';
import { ChatHistoryService } from '../services/chat-history.service';
import type { ChatHistory } from '../types/chat.types';

@Controller(CHAT_ROUTES.BASE)
export class ChatMessagesController {
  constructor(private readonly history: ChatHistoryService) {}

  // The roles are checked here and the role of the user picks how the order is matched.
  @Get(CHAT_ROUTES.MESSAGES)
  @Roles(ROLE.CLIENT, ROLE.COURIER)
  list(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
    @Query(new ZodValidationPipe(chatHistorySchema)) query: ChatHistoryDto,
  ): Promise<ChatHistory> {
    return this.history.list(user, params.orderId, query);
  }
}
