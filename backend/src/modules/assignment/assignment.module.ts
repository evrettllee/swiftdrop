import { Module } from '@nestjs/common';
import { CourierCandidatesService } from './services/courier-candidates.service';
import { DispatchOrdersService } from './services/dispatch-orders.service';

@Module({
  providers: [DispatchOrdersService, CourierCandidatesService],
})
export class AssignmentModule {}
