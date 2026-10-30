import { Module } from '@nestjs/common';
import { SupportTicketsController } from './controllers/support-tickets.controller';
import {
  SupportMessageThrottleGuard,
  SupportTicketCreateThrottleGuard,
} from './guards/support-throttle.guards';
import { SupportMessageWriterService } from './services/support-message-writer.service';
import { SupportTicketCreationService } from './services/support-ticket-creation.service';
import { SupportTicketMessagesService } from './services/support-ticket-messages.service';
import { SupportTicketsService } from './services/support-tickets.service';

@Module({
  controllers: [SupportTicketsController],
  providers: [
    SupportTicketsService,
    SupportTicketCreationService,
    SupportTicketMessagesService,
    SupportMessageWriterService,
    SupportTicketCreateThrottleGuard,
    SupportMessageThrottleGuard,
  ],
  exports: [SupportMessageWriterService],
})
export class SupportModule {}
