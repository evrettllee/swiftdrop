import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ROLE } from '@/common/enums/role.enum';
import { UserThrottle } from '@/common/guards/user-throttle.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import {
  ADMIN_EXPORT_SECTIONS,
  ANALYTICS_EXPORT_ROUTE,
  ANALYTICS_EXPORT_THROTTLE,
} from '@/modules/manager/constants/analytics-export.constants';
import { analyticsExportSchema } from '@/modules/manager/dto/analytics-export.dto';
import { exportHeaders } from '@/modules/manager/utils/export-headers';
import { ADMIN_ANALYTICS_ROUTES } from '../constants/admin-analytics.constants';
import {
  type AdminAnalyticsExportDto,
  AdminAnalyticsExportService,
} from '../services/admin-analytics-export.service';

@Controller(ADMIN_ANALYTICS_ROUTES.BASE)
@Roles(ROLE.ADMIN)
@UserThrottle(ANALYTICS_EXPORT_THROTTLE)
export class AdminAnalyticsExportController {
  constructor(private readonly exports: AdminAnalyticsExportService) {}

  @Get(ANALYTICS_EXPORT_ROUTE)
  async export(
    @Query(new ZodValidationPipe(analyticsExportSchema(ADMIN_EXPORT_SECTIONS)))
    query: AdminAnalyticsExportDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.exports.export(query);

    response.set(exportHeaders(file));

    return new StreamableFile(file.body);
  }
}
