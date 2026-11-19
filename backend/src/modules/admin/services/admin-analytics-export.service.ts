import { Inject, Injectable } from '@nestjs/common';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import {
  ADMIN_EXPORT_SECTIONS,
  ANALYTICS_EXPORT_FILE_PREFIX,
  ANALYTICS_EXPORT_ROW_LIMIT,
} from '@/modules/manager/constants/analytics-export.constants';
import type { AnalyticsExportDto } from '@/modules/manager/dto/analytics-export.dto';
import type {
  AnalyticsCourierExportRow,
  AnalyticsPeriod,
} from '@/modules/manager/types/manager-analytics.types';
import type { ExportFile, ExportSheet } from '@/modules/manager/types/manager-export.types';
import { analyticsCouriersExportSql } from '@/modules/manager/utils/analytics-couriers-query';
import { couriersSheet } from '@/modules/manager/utils/analytics-export/couriers-sheet';
import { analyticsExportFile, lazy } from '@/modules/manager/utils/analytics-export/export-file';
import { zonesSheet } from '@/modules/manager/utils/analytics-export/zones-sheet';
import { resolveAnalyticsPeriod } from '@/modules/manager/utils/analytics-period';
import type { RecentFailure } from '../types/admin-analytics.types';
import { ordersCreatedByDaySql } from '../utils/analytics/business-queries';
import { recentFailuresSql } from '../utils/analytics/service-queries';
import { adminDaysSheet, toExportDays } from '../utils/analytics-export/admin-days-sheet';
import { adminSummarySheet } from '../utils/analytics-export/admin-summary-sheet';
import { failuresSheet } from '../utils/analytics-export/failures-sheet';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminServiceAnalyticsService } from './admin-service-analytics.service';
import { AdminSupportAnalyticsService } from './admin-support-analytics.service';
import { AdminUsersAnalyticsService } from './admin-users-analytics.service';

type AdminSection = (typeof ADMIN_EXPORT_SECTIONS)[number];

export type AdminAnalyticsExportDto = AnalyticsExportDto<AdminSection>;

type SheetBuilder = () => Promise<ExportSheet>;

type DayCount = { date: string; count: number };

@Injectable()
export class AdminAnalyticsExportService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly analytics: AdminAnalyticsService,
    private readonly usersAnalytics: AdminUsersAnalyticsService,
    private readonly supportAnalytics: AdminSupportAnalyticsService,
    private readonly serviceAnalytics: AdminServiceAnalyticsService,
  ) {}

  async export(query: AdminAnalyticsExportDto, now = new Date()): Promise<ExportFile> {
    const period = resolveAnalyticsPeriod(query, now, APP_TIME_ZONE);
    const builders = this.builders(period, now);
    const sheets = await Promise.all(query.sections.map((section) => builders[section]()));
    const { from, to } = period.current;

    return analyticsExportFile(
      { prefix: ANALYTICS_EXPORT_FILE_PREFIX.ADMIN, from, to, format: query.format },
      sheets,
    );
  }

  private tabsOf(range: { from: string; to: string }, now: Date) {
    const delivery = lazy(() => this.analytics.delivery(range, now));
    const all = lazy(async () => {
      const [business, deliveryTab, users, support, service] = await Promise.all([
        this.analytics.business(range, now),
        delivery(),
        this.usersAnalytics.users(range, now),
        this.supportAnalytics.support(range, now),
        this.serviceAnalytics.service(range, now),
      ]);

      return { business, delivery: deliveryTab, users, support, service };
    });

    return { delivery, all };
  }

  private builders(period: AnalyticsPeriod, now: Date): Record<AdminSection, SheetBuilder> {
    const { from, to } = period.current;
    const tabs = this.tabsOf({ from, to }, now);
    const previous = { previousFrom: period.previous.from, previousTo: period.previous.to };

    return {
      summary: async () =>
        adminSummarySheet({ period: { from, to, ...previous }, ...(await tabs.all()) }),
      days: async () => {
        const [sources, created] = await Promise.all([
          tabs.all(),
          this.db.execute<DayCount>(ordersCreatedByDaySql(period.current, APP_TIME_ZONE)),
        ]);

        return adminDaysSheet(toExportDays(from, to, { ...sources, created: created.rows }));
      },
      zones: async () => zonesSheet((await tabs.delivery()).zones),
      couriers: async () => couriersSheet(await this.courierRows(period)),
      failures: async () => failuresSheet(await this.failureRows(period)),
    };
  }

  private async courierRows(period: AnalyticsPeriod): Promise<AnalyticsCourierExportRow[]> {
    const query = analyticsCouriersExportSql(period, ANALYTICS_EXPORT_ROW_LIMIT);

    return (await this.db.execute<AnalyticsCourierExportRow>(query)).rows;
  }

  private async failureRows(period: AnalyticsPeriod): Promise<RecentFailure[]> {
    const query = recentFailuresSql(period.current, ANALYTICS_EXPORT_ROW_LIMIT);

    return (await this.db.execute<RecentFailure>(query)).rows;
  }
}
