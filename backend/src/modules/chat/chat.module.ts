import { Module } from '@nestjs/common';
import { CouriersModule } from '../couriers/couriers.module';
import { ChatMessagesController } from './controllers/chat-messages.controller';
import { ChatSendThrottleGuard } from './guards/chat-send-throttle.guard';
import { ChatHistoryService } from './services/chat-history.service';
import { ChatReadService } from './services/chat-read.service';
import { ChatSendService } from './services/chat-send.service';
import { ChatUnreadService } from './services/chat-unread.service';

// The order rooms live in the socket gateway of CouriersModule.
@Module({
  imports: [CouriersModule],
  controllers: [ChatMessagesController],
  providers: [
    ChatHistoryService,
    ChatUnreadService,
    ChatSendService,
    ChatReadService,
    ChatSendThrottleGuard,
  ],
})
export class ChatModule {}
