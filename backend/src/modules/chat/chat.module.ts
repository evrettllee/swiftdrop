import { Module } from '@nestjs/common';
import { RealtimeModule } from '@/modules/realtime/realtime.module';
import { ChatMessagesController } from './controllers/chat-messages.controller';
import { ChatHistoryService } from './services/chat-history.service';
import { ChatReadService } from './services/chat-read.service';
import { ChatSendService } from './services/chat-send.service';
import { ChatUnreadService } from './services/chat-unread.service';

// The order rooms live in the socket gateway of RealtimeModule.
@Module({
  imports: [RealtimeModule],
  controllers: [ChatMessagesController],
  providers: [ChatHistoryService, ChatUnreadService, ChatSendService, ChatReadService],
})
export class ChatModule {}
