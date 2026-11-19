import { Inject, Injectable } from '@nestjs/common';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import type { AnalyticsSummaryDto } from '@/modules/manager/dto/manager-analytics.dto';
import { resolveAnalyticsPeriod } from '@/modules/manager/utils/analytics-period';
import { toTopics } from '../mappers/admin-analytics-blocks.mapper';
import { compare, splitPeriods } from '../mappers/admin-analytics.mapper';
import type { SupportAnalytics } from '../types/admin-analytics.types';
import { fillDays } from '../utils/analytics/fill-days';
import {
  firstResponseByDaySql,
  supportKpiSql,
  supportTopicsSql,
} from '../utils/analytics/support-queries';

type SupportKpiRow = {
  isCurrent: boolean;
  ticketsCreated: number;
  closed: number;
  firstResponseMedianMinutes: number | null;
  unanswered: number;
  longestWaitMinutes: number | null;
};

const NO_TICKETS: Omit<SupportAnalytics['firstResponseByDay'][number], 'date'> = {
  medianMinutes: null,
  tickets: 0,
};

@Injectable()
export class AdminSupportAnalyticsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async support(query: AnalyticsSummaryDto, now = new Date()): Promise<SupportAnalytics> {
    const period = resolveAnalyticsPeriod(query, now, APP_TIME_ZONE);
    const { from, to } = period.current;
    const [kpiRows, topicRows, dayRows] = await Promise.all([
      this.db.execute<SupportKpiRow>(supportKpiSql(period, now)),
      this.db.execute<SupportAnalytics['topics'][number]>(supportTopicsSql(period.current)),
      this.db.execute<SupportAnalytics['firstResponseByDay'][number]>(
        firstResponseByDaySql(period.current, APP_TIME_ZONE),
      ),
    ]);
    const kpis = splitPeriods(kpiRows.rows);
    const { unanswered, longestWaitMinutes } = kpis.current;

    return {
      period: { from, to },
      kpis: {
        ticketsCreated: compare(kpis, (row) => row.ticketsCreated),
        firstResponseMedianMinutes: compare(kpis, (row) => row.firstResponseMedianMinutes),
        closed: compare(kpis, (row) => ({ closed: row.closed, total: row.ticketsCreated })),
        unansweredNow: { count: unanswered, longestWaitMinutes },
      },
      topics: toTopics(topicRows.rows),
      firstResponseByDay: fillDays(from, to, dayRows.rows, NO_TICKETS),
    };
  }
}
