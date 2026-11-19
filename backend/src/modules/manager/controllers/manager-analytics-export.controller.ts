import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ROLE } from '@/common/enums/role.enum';
import { UserThrottle } from '@/common/guards/user-throttle.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import {
  ANALYTICS_EXPORT_ROUTE,
  ANALYTICS_EXPORT_THROTTLE,
  MANAGER_EXPORT_SECTIONS,
} from '../constants/analytics-export.constants';
import { MANAGER_ANALYTICS_ROUTES } from '../constants/manager-analytics.constants';
import { analyticsExportSchema } from '../dto/analytics-export.dto';
import {
  type ManagerAnalyticsExportDto,
  ManagerAnalyticsExportService,
} from '../services/manager-analytics-export.service';
import { exportHeaders } from '../utils/export-headers';

@Controller(MANAGER_ANALYTICS_ROUTES.BASE)
@Roles(ROLE.MANAGER)
@UserThrottle(ANALYTICS_EXPORT_THROTTLE)
export class ManagerAnalyticsExportController {
  constructor(private readonly exports: ManagerAnalyticsExportService) {}

  @Get(ANALYTICS_EXPORT_ROUTE)
  async export(
    @Query(new ZodValidationPipe(analyticsExportSchema(MANAGER_EXPORT_SECTIONS)))
    query: ManagerAnalyticsExportDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.exports.export(query);

    response.set(exportHeaders(file));

    return new StreamableFile(file.body);
  }
}
