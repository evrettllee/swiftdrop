import { Inject, Injectable } from '@nestjs/common';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { MAX_OFFERS_PER_ORDER } from '@/modules/assignment/constants/assignment.constants';
import type { AnalyticsSummaryDto } from '@/modules/manager/dto/manager-analytics.dto';
import { resolveAnalyticsPeriod } from '@/modules/manager/utils/analytics-period';
import {
  type BusinessKpiRow,
  compare,
  type DeliveryKpiRow,
  splitPeriods,
} from '../mappers/admin-analytics.mapper';
import type {
  BusinessAnalytics,
  DeliveryAnalytics,
  DeliveryZoneRow,
} from '../types/admin-analytics.types';
import {
  businessFunnelSql,
  businessKpiSql,
  revenueByDaySql,
} from '../utils/analytics/business-queries';
import { deliveryKpiSql, offersSql, onTimeByDaySql } from '../utils/analytics/delivery-queries';
import { deliveryZonesSql } from '../utils/analytics/delivery-zones-query';
import { fillDays } from '../utils/analytics/fill-days';

type FunnelRow = BusinessAnalytics['funnel'] & {
  unpaidExpired: number;
  cancelledBeforePayment: number;
  cancelledByClient: number;
  cancelledBySystem: number;
  cancelledByStaff: number;
  inProgress: number;
};

@Injectable()
export class AdminAnalyticsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async business(query: AnalyticsSummaryDto, now = new Date()): Promise<BusinessAnalytics> {
    const period = resolveAnalyticsPeriod(query, now, APP_TIME_ZONE);
    const { from, to } = period.current;
    const [kpiRows, funnelRows, dayRows] = await Promise.all([
      this.db.execute<BusinessKpiRow>(businessKpiSql(period)),
      this.db.execute<FunnelRow>(businessFunnelSql(period.current)),
      this.db.execute<BusinessAnalytics['revenueByDay'][number]>(
        revenueByDaySql(period.current, APP_TIME_ZONE),
      ),
    ]);
    const kpis = splitPeriods(kpiRows.rows);
    const [funnel] = funnelRows.rows;

    return {
      period: { from, to },
      kpis: {
        ordersCreated: compare(kpis, (row) => row.ordersCreated),
        revenue: compare(kpis, (row) => row.revenue),
        averageCheck: compare(kpis, (row) => row.averageCheck),
        refunds: compare(kpis, (row) => ({ amount: row.refundAmount, orders: row.refundOrders })),
      },
      funnel: {
        created: funnel.created,
        paid: funnel.paid,
        courierAssigned: funnel.courierAssigned,
        delivered: funnel.delivered,
      },
      losses: {
        unpaidExpired: funnel.unpaidExpired,
        cancelledBeforePayment: funnel.cancelledBeforePayment,
        cancelledAfterPayment: {
          client: funnel.cancelledByClient,
          system: funnel.cancelledBySystem,
          staff: funnel.cancelledByStaff,
        },
        inProgress: funnel.inProgress,
      },
      revenueByDay: fillDays(from, to, dayRows.rows, { revenue: 0, delivered: 0 }),
    };
  }

  async delivery(query: AnalyticsSummaryDto, now = new Date()): Promise<DeliveryAnalytics> {
    const period = resolveAnalyticsPeriod(query, now, APP_TIME_ZONE);
    const { from, to } = period.current;
    const [kpiRows, dayRows, offerRows, zoneRows] = await Promise.all([
      this.db.execute<DeliveryKpiRow>(deliveryKpiSql(period)),
      this.db.execute<DeliveryAnalytics['onTimeByDay'][number]>(
        onTimeByDaySql(period.current, APP_TIME_ZONE),
      ),
      this.db.execute<Omit<DeliveryAnalytics['offers'], 'maxDeclinesBeforeManual'>>(
        offersSql(period.current),
      ),
      this.db.execute<DeliveryZoneRow>(deliveryZonesSql(period.current)),
    ]);
    const kpis = splitPeriods(kpiRows.rows);

    return {
      period: { from, to },
      kpis: {
        onTimeRate: compare(kpis, (row) => ({ onTime: row.onTime, total: row.onTimeTotal })),
        averageDeliveryMinutes: compare(kpis, (row) => row.averageDeliveryMinutes),
        autoAssignedRate: compare(kpis, (row) => ({ auto: row.auto, manual: row.manual })),
        averageSearchSeconds: compare(kpis, (row) => row.averageSearchSeconds),
      },
      onTimeByDay: fillDays(from, to, dayRows.rows, { onTime: 0, total: 0 }),
      offers: { ...offerRows.rows[0], maxDeclinesBeforeManual: MAX_OFFERS_PER_ORDER },
      zones: zoneRows.rows,
    };
  }
}
