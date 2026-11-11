import {
  ANALYTICS_DECIMALS,
  ANALYTICS_HOURS_PER_DAY,
} from '../constants/manager-analytics.constants';
import type {
  AnalyticsActivityRow,
  AnalyticsDay,
  AnalyticsHour,
  AnalyticsKpiRow,
  AnalyticsKpis,
  AnalyticsKpiValues,
  AnalyticsPeriod,
  AnalyticsSummary,
} from '../types/manager-analytics.types';
import { datesOf } from '../utils/analytics-period';

const PERCENT = 100;
const DECIMAL_BASE = 10;

export function roundTo(value: number, decimals: number): number {
  const factor = DECIMAL_BASE ** decimals;

  return Math.round(value * factor) / factor;
}

function roundOrNull(value: number | null, decimals: number): number | null {
  return value === null ? null : roundTo(value, decimals);
}

export function percentOf(part: number, whole: number): number | null {
  return whole === 0 ? null : roundTo((part / whole) * PERCENT, ANALYTICS_DECIMALS.PERCENT);
}

export function toKpiValues(row: AnalyticsKpiRow): AnalyticsKpiValues {
  return {
    delivered: { delivered: row.delivered, total: row.total },
    onTime: { pct: percentOf(row.onTime, row.timed), count: row.onTime },
    avgDeliveryMin: roundOrNull(row.avgDeliveryMin, ANALYTICS_DECIMALS.MINUTES),
    cancelled: {
      pct: percentOf(row.cancelled, row.total),
      count: row.cancelled,
      by: {
        client: row.cancelledByClient,
        system: row.cancelledBySystem,
        staff: row.cancelledByStaff,
      },
    },
    revenue: { total: row.revenue, avgCheck: row.avgCheck, orders: row.paidOrders },
    courierSearch: {
      avgMin: roundOrNull(row.avgSearchMin, ANALYTICS_DECIMALS.MINUTES),
      manual: row.manual,
    },
  };
}

function toKpis(rows: readonly AnalyticsKpiRow[]): AnalyticsKpis {
  const pick = (isCurrent: boolean) => {
    const row = rows.find((candidate) => candidate.isCurrent === isCurrent);

    if (!row) {
      throw new Error(
        `Analytics row for the ${isCurrent ? 'current' : 'previous'} period is missing`,
      );
    }

    return toKpiValues(row);
  };
  const current = pick(true);
  const previous = pick(false);
  const keys = Object.keys(current) as (keyof AnalyticsKpiValues)[];

  return Object.fromEntries(
    keys.map((key) => [key, { current: current[key], previous: previous[key] }]),
  ) as AnalyticsKpis;
}

export function toDays(
  rows: readonly AnalyticsActivityRow[],
  from: string,
  to: string,
): AnalyticsDay[] {
  const days = new Map(
    datesOf(from, to).map((date) => [date, { date, delivered: 0, cancelled: 0, inProgress: 0 }]),
  );

  for (const row of rows) {
    const day = days.get(row.day);

    if (day) {
      day.delivered += row.delivered;
      day.cancelled += row.cancelled;
      day.inProgress += row.inProgress;
    }
  }

  return [...days.values()];
}

export function toHours(rows: readonly AnalyticsActivityRow[], days: number): AnalyticsHour[] {
  const totals = Array.from({ length: ANALYTICS_HOURS_PER_DAY }, () => 0);

  for (const row of rows) {
    totals[row.hour] += row.delivered + row.cancelled + row.inProgress;
  }

  return totals.map((total, hour) => ({
    hour,
    avgOrders: roundTo(total / days, ANALYTICS_DECIMALS.ORDERS_PER_HOUR),
  }));
}

export function toAnalyticsSummary(
  period: AnalyticsPeriod,
  kpiRows: readonly AnalyticsKpiRow[],
  activity: readonly AnalyticsActivityRow[],
): AnalyticsSummary {
  const { current, previous, days } = period;

  return {
    period: {
      from: current.from,
      to: current.to,
      previousFrom: previous.from,
      previousTo: previous.to,
    },
    kpis: toKpis(kpiRows),
    days: toDays(activity, current.from, current.to),
    hours: toHours(activity, days),
  };
}
