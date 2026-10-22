import { Module } from '@nestjs/common';
import { ChatMessagesController } from './controllers/chat-messages.controller';
import { ChatHistoryService } from './services/chat-history.service';

@Module({
  controllers: [ChatMessagesController],
  providers: [ChatHistoryService],
})
export class ChatModule {}
