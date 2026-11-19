import { Inject, Injectable } from '@nestjs/common';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import type { AnalyticsSummaryDto } from '@/modules/manager/dto/manager-analytics.dto';
import { resolveAnalyticsPeriod } from '@/modules/manager/utils/analytics-period';
import { compare, splitPeriods } from '../mappers/admin-analytics.mapper';
import type { UsersAnalytics } from '../types/admin-analytics.types';
import { fillDays } from '../utils/analytics/fill-days';
import {
  newClientsByDaySql,
  ordersPerClientSql,
  usersKpiSql,
} from '../utils/analytics/users-queries';

type UsersKpiRow = {
  isCurrent: boolean;
  newClients: number;
  activeClients: number;
  repeatClients: number;
  averageDeliveriesPerCourier: number | null;
  onShift: number;
  couriersTotal: number;
};

@Injectable()
export class AdminUsersAnalyticsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async users(query: AnalyticsSummaryDto, now = new Date()): Promise<UsersAnalytics> {
    const period = resolveAnalyticsPeriod(query, now, APP_TIME_ZONE);
    const { from, to } = period.current;
    const [kpiRows, dayRows, bucketRows] = await Promise.all([
      this.db.execute<UsersKpiRow>(usersKpiSql(period)),
      this.db.execute<UsersAnalytics['newClientsByDay'][number]>(
        newClientsByDaySql(period.current, APP_TIME_ZONE),
      ),
      this.db.execute<UsersAnalytics['ordersPerClient']>(ordersPerClientSql(period.current)),
    ]);
    const kpis = splitPeriods(kpiRows.rows);

    return {
      period: { from, to },
      kpis: {
        newClients: compare(kpis, (row) => row.newClients),
        activeClients: compare(kpis, (row) => row.activeClients),
        repeatClients: compare(kpis, (row) => ({
          repeat: row.repeatClients,
          active: row.activeClients,
        })),
        couriersOnline: { onShift: kpis.current.onShift, total: kpis.current.couriersTotal },
        averageDeliveriesPerCourier: compare(kpis, (row) => row.averageDeliveriesPerCourier),
      },
      newClientsByDay: fillDays(from, to, dayRows.rows, { count: 0 }),
      ordersPerClient: bucketRows.rows[0],
    };
  }
}
