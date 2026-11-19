import { Inject, Injectable } from '@nestjs/common';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import type { AnalyticsSummaryDto } from '@/modules/manager/dto/manager-analytics.dto';
import { resolveAnalyticsPeriod } from '@/modules/manager/utils/analytics-period';
import { toServices } from '../mappers/admin-analytics-blocks.mapper';
import { compare, splitPeriods } from '../mappers/admin-analytics.mapper';
import type {
  ExternalServiceRow,
  RecentFailure,
  ServiceAnalytics,
} from '../types/admin-analytics.types';
import { fillDays } from '../utils/analytics/fill-days';
import {
  recentFailuresSql,
  serverErrorsByDaySql,
  serviceKpiSql,
  servicesSql,
} from '../utils/analytics/service-queries';

type ServiceKpiRow = {
  isCurrent: boolean;
  serverErrors: number;
  externalFailures: number;
  externalServices: number;
  mailFailures: number;
  mailLastAt: string | null;
  savedRateUsed: number;
};

@Injectable()
export class AdminServiceAnalyticsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async service(query: AnalyticsSummaryDto, now = new Date()): Promise<ServiceAnalytics> {
    const period = resolveAnalyticsPeriod(query, now, APP_TIME_ZONE);
    const { from, to } = period.current;
    const [kpiRows, dayRows, serviceRows, recentRows] = await Promise.all([
      this.db.execute<ServiceKpiRow>(serviceKpiSql(period)),
      this.db.execute<ServiceAnalytics['serverErrorsByDay'][number]>(
        serverErrorsByDaySql(period.current, APP_TIME_ZONE),
      ),
      this.db.execute<ExternalServiceRow>(servicesSql(period.current)),
      this.db.execute<RecentFailure>(recentFailuresSql(period.current)),
    ]);
    const kpis = splitPeriods(kpiRows.rows);
    const { mailFailures, mailLastAt, savedRateUsed } = kpis.current;

    return {
      period: { from, to },
      kpis: {
        serverErrors: compare(kpis, (row) => row.serverErrors),
        externalFailures: compare(kpis, (row) => ({
          failures: row.externalFailures,
          services: row.externalServices,
        })),
        mailFailures: { count: mailFailures, lastAt: mailLastAt },
        savedRateUsed,
      },
      serverErrorsByDay: fillDays(from, to, dayRows.rows, { count: 0 }),
      services: toServices(serviceRows.rows),
      recent: recentRows.rows,
    };
  }
}
