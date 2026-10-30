import { Module } from '@nestjs/common';
import { AssignmentModule } from '@/modules/assignment/assignment.module';
import { CouriersModule } from '@/modules/couriers/couriers.module';
import { DeliveriesModule } from '@/modules/deliveries/deliveries.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { RealtimeModule } from '@/modules/realtime/realtime.module';
import { TrackingModule } from '@/modules/tracking/tracking.module';
import { ManagerAnalyticsController } from './controllers/manager-analytics.controller';
import { ManagerOrderAssignmentController } from './controllers/manager-order-assignment.controller';
import { ManagerCouriersController } from './controllers/manager-couriers.controller';
import { ManagerOrderCancellationController } from './controllers/manager-order-cancellation.controller';
import { ManagerOrdersController } from './controllers/manager-orders.controller';
import { ManagerZonesController } from './controllers/manager-zones.controller';
import {
  ManagerAnalyticsThrottleGuard,
  ManagerExportThrottleGuard,
} from './guards/manager-throttle.guards';
import { ManagerAnalyticsService } from './services/manager-analytics.service';
import { ManagerOrderCountsService } from './services/manager-order-counts.service';
import { ManagerOrderDetailsService } from './services/manager-order-details.service';
import { ManagerCourierCandidatesService } from './services/manager-courier-candidates.service';
import { ManagerExportLimits } from './services/manager-export-limits';
import { ManagerAssignmentRestartService } from './services/manager-assignment-restart.service';
import { ManagerCouriersMapService } from './services/manager-couriers-map.service';
import { ManagerCourierLockService } from './services/manager-courier-lock.service';
import { ManagerOrderAssignmentService } from './services/manager-order-assignment.service';
import { ManagerOrderCancellationService } from './services/manager-order-cancellation.service';
import { ManagerOrderReassignmentService } from './services/manager-order-reassignment.service';
import { ManagerOrdersExportService } from './services/manager-orders-export.service';
import { ManagerOrdersService } from './services/manager-orders.service';
import { ManagerZoneWritesService } from './services/manager-zone-writes.service';
import { ManagerZonesService } from './services/manager-zones.service';

@Module({
  imports: [
    DeliveriesModule,
    AssignmentModule,
    CouriersModule,
    TrackingModule,
    OrdersModule,
    RealtimeModule,
  ],
  controllers: [
    ManagerOrdersController,
    ManagerOrderAssignmentController,
    ManagerOrderCancellationController,
    ManagerCouriersController,
    ManagerZonesController,
    ManagerAnalyticsController,
  ],
  providers: [
    ManagerOrdersService,
    ManagerOrderCountsService,
    ManagerOrderDetailsService,
    ManagerOrdersExportService,
    ManagerExportLimits,
    ManagerCourierCandidatesService,
    ManagerCourierLockService,
    ManagerOrderAssignmentService,
    ManagerOrderReassignmentService,
    ManagerAssignmentRestartService,
    ManagerOrderCancellationService,
    ManagerCouriersMapService,
    ManagerZonesService,
    ManagerZoneWritesService,
    ManagerAnalyticsService,
    ManagerExportThrottleGuard,
    ManagerAnalyticsThrottleGuard,
  ],
})
export class ManagerModule {}
