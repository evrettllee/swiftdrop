import { Module } from '@nestjs/common';
import { AssignmentModule } from '@/modules/assignment/assignment.module';
import { CouriersModule } from '@/modules/couriers/couriers.module';
import { DeliveriesModule } from '@/modules/deliveries/deliveries.module';
import { TrackingModule } from '@/modules/tracking/tracking.module';
import { ManagerOrderAssignmentController } from './controllers/manager-order-assignment.controller';
import { ManagerOrdersController } from './controllers/manager-orders.controller';
import { ManagerOrderCountsService } from './services/manager-order-counts.service';
import { ManagerOrderDetailsService } from './services/manager-order-details.service';
import { ManagerCourierCandidatesService } from './services/manager-courier-candidates.service';
import { ManagerExportLimits } from './services/manager-export-limits';
import { ManagerOrderAssignmentService } from './services/manager-order-assignment.service';
import { ManagerOrdersExportService } from './services/manager-orders-export.service';
import { ManagerOrdersService } from './services/manager-orders.service';

@Module({
  imports: [DeliveriesModule, AssignmentModule, CouriersModule, TrackingModule],
  controllers: [ManagerOrdersController, ManagerOrderAssignmentController],
  providers: [
    ManagerOrdersService,
    ManagerOrderCountsService,
    ManagerOrderDetailsService,
    ManagerOrdersExportService,
    ManagerExportLimits,
    ManagerCourierCandidatesService,
    ManagerOrderAssignmentService,
  ],
})
export class ManagerModule {}
