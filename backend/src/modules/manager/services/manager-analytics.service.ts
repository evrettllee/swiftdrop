import { Inject, Injectable } from '@nestjs/common';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import type { AnalyticsCouriersDto, AnalyticsSummaryDto } from '../dto/manager-analytics.dto';
import { toAnalyticsSummary } from '../mappers/manager-analytics.mapper';
import type {
  AnalyticsActivityRow,
  AnalyticsCourier,
  AnalyticsCouriersPage,
  AnalyticsKpiRow,
  AnalyticsSummary,
} from '../types/manager-analytics.types';
import { analyticsCouriersCountSql, analyticsCouriersSql } from '../utils/analytics-couriers-query';
import { resolveAnalyticsPeriod } from '../utils/analytics-period';
import { analyticsActivitySql, analyticsKpiSql } from '../utils/analytics-summary-query';

@Injectable()
export class ManagerAnalyticsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async summary(query: AnalyticsSummaryDto, now = new Date()): Promise<AnalyticsSummary> {
    const period = resolveAnalyticsPeriod(query, now, APP_TIME_ZONE);
    const [kpis, activity] = await Promise.all([
      this.db.execute<AnalyticsKpiRow>(analyticsKpiSql(period)),
      this.db.execute<AnalyticsActivityRow>(analyticsActivitySql(period, APP_TIME_ZONE)),
    ]);

    return toAnalyticsSummary(period, kpis.rows, activity.rows);
  }

  async couriers(query: AnalyticsCouriersDto, now = new Date()): Promise<AnalyticsCouriersPage> {
    const period = resolveAnalyticsPeriod(query, now, APP_TIME_ZONE);
    const request = { period, sort: query.sort, page: query.page, limit: query.limit };
    const [items, counted] = await Promise.all([
      this.db.execute<AnalyticsCourier>(analyticsCouriersSql(request)),
      this.db.execute<{ total: number }>(analyticsCouriersCountSql(request)),
    ]);

    return {
      items: items.rows,
      total: counted.rows[0]?.total ?? 0,
      page: query.page,
      limit: query.limit,
      period: { from: period.current.from, to: period.current.to },
    };
  }
}
