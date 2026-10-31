import { Module } from '@nestjs/common';
import { RealtimeModule } from '@/modules/realtime/realtime.module';
import { SupportStaffController } from './controllers/support-staff.controller';
import { SupportTicketsController } from './controllers/support-tickets.controller';
import { SupportEventsService } from './services/support-events.service';
import { SupportMessageWriterService } from './services/support-message-writer.service';
import { SupportStaffTicketsService } from './services/support-staff-tickets.service';
import { SupportTicketClosingService } from './services/support-ticket-closing.service';
import { SupportTicketCreationService } from './services/support-ticket-creation.service';
import { SupportTicketMessagesService } from './services/support-ticket-messages.service';
import { SupportTicketsService } from './services/support-tickets.service';

@Module({
  imports: [RealtimeModule],
  controllers: [SupportTicketsController, SupportStaffController],
  providers: [
    SupportTicketsService,
    SupportTicketCreationService,
    SupportTicketMessagesService,
    SupportTicketClosingService,
    SupportStaffTicketsService,
    SupportMessageWriterService,
    SupportEventsService,
  ],
})
export class SupportModule {}
