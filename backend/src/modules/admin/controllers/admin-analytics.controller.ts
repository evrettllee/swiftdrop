import { Controller, Get, Query } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { UserThrottle } from '@/common/guards/user-throttle.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import {
  type AnalyticsSummaryDto,
  analyticsSummarySchema,
} from '@/modules/manager/dto/manager-analytics.dto';
import {
  ADMIN_ANALYTICS_ROUTES,
  ADMIN_ANALYTICS_THROTTLE,
} from '../constants/admin-analytics.constants';
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { AdminServiceAnalyticsService } from '../services/admin-service-analytics.service';
import { AdminSupportAnalyticsService } from '../services/admin-support-analytics.service';
import { AdminUsersAnalyticsService } from '../services/admin-users-analytics.service';
import type {
  BusinessAnalytics,
  DeliveryAnalytics,
  ServiceAnalytics,
  SupportAnalytics,
  UsersAnalytics,
} from '../types/admin-analytics.types';

@Controller(ADMIN_ANALYTICS_ROUTES.BASE)
@Roles(ROLE.ADMIN)
@UserThrottle(ADMIN_ANALYTICS_THROTTLE)
export class AdminAnalyticsController {
  constructor(
    private readonly analytics: AdminAnalyticsService,
    private readonly usersAnalytics: AdminUsersAnalyticsService,
    private readonly supportAnalytics: AdminSupportAnalyticsService,
    private readonly serviceAnalytics: AdminServiceAnalyticsService,
  ) {}

  @Get(ADMIN_ANALYTICS_ROUTES.BUSINESS)
  business(
    @Query(new ZodValidationPipe(analyticsSummarySchema)) query: AnalyticsSummaryDto,
  ): Promise<BusinessAnalytics> {
    return this.analytics.business(query);
  }

  @Get(ADMIN_ANALYTICS_ROUTES.DELIVERY)
  delivery(
    @Query(new ZodValidationPipe(analyticsSummarySchema)) query: AnalyticsSummaryDto,
  ): Promise<DeliveryAnalytics> {
    return this.analytics.delivery(query);
  }

  @Get(ADMIN_ANALYTICS_ROUTES.USERS)
  users(
    @Query(new ZodValidationPipe(analyticsSummarySchema)) query: AnalyticsSummaryDto,
  ): Promise<UsersAnalytics> {
    return this.usersAnalytics.users(query);
  }

  @Get(ADMIN_ANALYTICS_ROUTES.SUPPORT)
  support(
    @Query(new ZodValidationPipe(analyticsSummarySchema)) query: AnalyticsSummaryDto,
  ): Promise<SupportAnalytics> {
    return this.supportAnalytics.support(query);
  }

  @Get(ADMIN_ANALYTICS_ROUTES.SERVICE)
  service(
    @Query(new ZodValidationPipe(analyticsSummarySchema)) query: AnalyticsSummaryDto,
  ): Promise<ServiceAnalytics> {
    return this.serviceAnalytics.service(query);
  }
}
