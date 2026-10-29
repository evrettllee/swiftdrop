import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@/modules/auth/auth.module';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import {
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL_MS,
  THROTTLE_ERROR_MESSAGE,
} from '@/common/constants/http.constants';
import { InternalErrorFilter } from '@/common/filters/internal-error.filter';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { ENV_FILE_PATH } from '@/config/env.constants';
import { validateEnv } from '@/config/env.validation';
import { DatabaseModule } from '@/database/database.module';
import { AssignmentModule } from '@/modules/assignment/assignment.module';
import { ChatModule } from '@/modules/chat/chat.module';
import { CouriersModule } from '@/modules/couriers/couriers.module';
import { DeliveriesModule } from '@/modules/deliveries/deliveries.module';
import { ManagerModule } from '@/modules/manager/manager.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { PricingModule } from '@/modules/pricing/pricing.module';
import { RoutingModule } from '@/modules/routing/routing.module';
import { ZonesModule } from '@/modules/zones/zones.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [ENV_FILE_PATH],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: DEFAULT_THROTTLE_TTL_MS, limit: DEFAULT_THROTTLE_LIMIT }],
      errorMessage: THROTTLE_ERROR_MESSAGE,
    }),
    DatabaseModule,
    AuthModule,
    ZonesModule,
    PricingModule,
    OrdersModule,
    PaymentsModule,
    CouriersModule,
    AssignmentModule,
    DeliveriesModule,
    RoutingModule,
    ChatModule,
    ManagerModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: InternalErrorFilter },
  ],
})
export class AppModule {}
