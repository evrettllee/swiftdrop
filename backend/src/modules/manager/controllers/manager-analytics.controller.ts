import { Controller, Get, Query } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { MANAGER_ANALYTICS_ROUTES } from '../constants/manager-analytics.constants';
import {
  type AnalyticsCouriersDto,
  analyticsCouriersSchema,
  type AnalyticsSummaryDto,
  analyticsSummarySchema,
} from '../dto/manager-analytics.dto';
import { ManagerAnalyticsService } from '../services/manager-analytics.service';
import type { AnalyticsCouriersPage, AnalyticsSummary } from '../types/manager-analytics.types';

@Controller(MANAGER_ANALYTICS_ROUTES.BASE)
@Roles(ROLE.MANAGER, ROLE.ADMIN)
export class ManagerAnalyticsController {
  constructor(private readonly analytics: ManagerAnalyticsService) {}

  @Get(MANAGER_ANALYTICS_ROUTES.SUMMARY)
  summary(
    @Query(new ZodValidationPipe(analyticsSummarySchema)) query: AnalyticsSummaryDto,
  ): Promise<AnalyticsSummary> {
    return this.analytics.summary(query);
  }

  @Get(MANAGER_ANALYTICS_ROUTES.COURIERS)
  couriers(
    @Query(new ZodValidationPipe(analyticsCouriersSchema)) query: AnalyticsCouriersDto,
  ): Promise<AnalyticsCouriersPage> {
    return this.analytics.couriers(query);
  }
}
