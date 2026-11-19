import { Inject, Injectable } from '@nestjs/common';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import {
  ANALYTICS_EXPORT_FILE_PREFIX,
  ANALYTICS_EXPORT_ROW_LIMIT,
  MANAGER_EXPORT_SECTIONS,
} from '../constants/analytics-export.constants';
import type { AnalyticsExportDto } from '../dto/analytics-export.dto';
import type { AnalyticsCourierExportRow } from '../types/manager-analytics.types';
import type { ExportFile, ExportSheet } from '../types/manager-export.types';
import { analyticsCouriersExportSql } from '../utils/analytics-couriers-query';
import { couriersSheet } from '../utils/analytics-export/couriers-sheet';
import { analyticsExportFile, lazy } from '../utils/analytics-export/export-file';
import { managerDaysSheet, managerHoursSheet } from '../utils/analytics-export/manager-day-sheets';
import { managerSummarySheet } from '../utils/analytics-export/manager-summary-sheet';
import { zonesSheet } from '../utils/analytics-export/zones-sheet';
import { resolveAnalyticsPeriod } from '../utils/analytics-period';
import { ManagerAnalyticsService } from './manager-analytics.service';

type ManagerSection = (typeof MANAGER_EXPORT_SECTIONS)[number];

export type ManagerAnalyticsExportDto = AnalyticsExportDto<ManagerSection>;

@Injectable()
export class ManagerAnalyticsExportService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly analytics: ManagerAnalyticsService,
  ) {}

  async export(query: ManagerAnalyticsExportDto, now = new Date()): Promise<ExportFile> {
    const period = resolveAnalyticsPeriod(query, now, APP_TIME_ZONE);
    const { from, to } = period.current;
    const summary = lazy(() => this.analytics.summary({ from, to }, now));
    const builders: Record<ManagerSection, () => Promise<ExportSheet>> = {
      summary: async () => managerSummarySheet(await summary()),
      days: async () => managerDaysSheet((await summary()).days),
      hours: async () => managerHoursSheet((await summary()).hours),
      zones: async () => zonesSheet((await summary()).zones),
      couriers: async () =>
        couriersSheet(
          (
            await this.db.execute<AnalyticsCourierExportRow>(
              analyticsCouriersExportSql(period, ANALYTICS_EXPORT_ROW_LIMIT),
            )
          ).rows,
        ),
    };
    const sheets = await Promise.all(query.sections.map((section) => builders[section]()));

    return analyticsExportFile(
      { prefix: ANALYTICS_EXPORT_FILE_PREFIX.MANAGER, from, to, format: query.format },
      sheets,
    );
  }
}
