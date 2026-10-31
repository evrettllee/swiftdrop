import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import type { AnalyticsCourierSortKey } from '../constants/manager-analytics.constants';
import {
  analyticsCouriersCountSql,
  analyticsCouriersSql,
  shiftEndSql,
} from './analytics-couriers-query';
import { ORDER_FACT, placedInPeriod } from './analytics-metrics';
import { resolveAnalyticsPeriod } from './analytics-period';
import { analyticsActivitySql, analyticsKpiSql } from './analytics-summary-query';

const dialect = new PgDialect({ casing: 'snake_case' });
const render = (query: SQL) => dialect.sqlToQuery(query);
const flat = (text: string) => text.replace(/\s+/g, ' ');
const period = resolveAnalyticsPeriod(
  { from: '2026-10-01', to: '2026-10-07' },
  new Date(),
  APP_TIME_ZONE,
);

function couriers(key: AnalyticsCourierSortKey, direction: 'asc' | 'desc', page = 1) {
  return render(analyticsCouriersSql({ period, sort: { key, direction }, page, limit: 20 }));
}

describe('analytics definitions', () => {
  it('should count on time against the confirmation plus the estimate given at placing', () => {
    expect(flat(render(ORDER_FACT.isOnTime).sql)).toBe(
      "f.status = 'delivered' and f.confirmed_at is not null and f.estimated_minutes is not null" +
        " and f.finished_at <= f.confirmed_at + f.estimated_minutes * interval '1 minute'",
    );
  });

  it('should use the same on time and delivery time in the summary and in the couriers', () => {
    const onTime = flat(render(ORDER_FACT.isOnTime).sql);
    const minutes = flat(render(ORDER_FACT.deliveryMinutes).sql);

    for (const query of [
      analyticsKpiSql(period),
      analyticsCouriersCountSql({
        period,
        sort: { key: 'delivered', direction: 'desc' },
        page: 1,
        limit: 20,
      }),
    ]) {
      const text = flat(render(query).sql);

      expect(text).toContain(onTime);
      expect(text).toContain(minutes);
    }
  });

  it('should take the first confirmation, the first assignment and the last cancellation', () => {
    const text = flat(render(analyticsKpiSql(period)).sql);

    expect(text).toContain(
      `min("order_status_history"."changed_at") filter (where "order_status_history"."status" = 'confirmed') as confirmed_at`,
    );
    expect(text).toContain(
      `order by "order_status_history"."changed_at", "order_status_history"."status_history_id") filter (where "order_status_history"."status" = 'courier_assigned'))[1] as assigned_by`,
    );
    expect(text).toContain(
      `order by "order_status_history"."changed_at" desc, "order_status_history"."status_history_id" desc) filter (where "order_status_history"."status" = 'cancelled'))[1] as cancelled_by`,
    );
    expect(text).toContain(`"roles"."name" in ('manager', 'admin')`);
    expect(text).toContain(`when timeline.cancelled_by = "orders"."client_id" then 'client'`);
  });

  it('should count revenue by paid and not refunded payments', () => {
    const text = flat(render(analyticsKpiSql(period)).sql);

    expect(text).toContain(`where "payments"."status" = 'paid' and "payments"."paid_at" >= $`);
  });

  it('should take only orders confirmed at least once, in every query', () => {
    const confirmed = flat(render(placedInPeriod(period.current.start, period.current.end)).sql);
    const request = {
      period,
      sort: { key: 'delivered', direction: 'desc' },
      page: 1,
      limit: 20,
    } as const;

    expect(confirmed).toContain(
      `exists ( select 1 from "order_status_history" where "order_status_history"."order_id" = "orders"."order_id" and "order_status_history"."status" = 'confirmed' )`,
    );
    expect(confirmed).not.toContain('pending');

    for (const query of [
      analyticsKpiSql(period),
      analyticsActivitySql(period, APP_TIME_ZONE),
      analyticsCouriersSql(request),
      analyticsCouriersCountSql(request),
    ]) {
      expect(flat(render(query).sql)).toContain(confirmed.slice(confirmed.indexOf('exists')));
    }
  });

  it('should group the activity by the Minsk day and hour of placing', () => {
    const { sql, params } = render(analyticsActivitySql(period, APP_TIME_ZONE));

    expect(flat(sql)).toContain('to_char((f.created_at at time zone $1), \'YYYY-MM-DD\') as "day"');
    expect(params[0]).toBe(APP_TIME_ZONE);
  });
});

describe('analytics couriers query', () => {
  it('should end an open shift at the last position plus 2 minutes, never after now', () => {
    expect(flat(render(shiftEndSql()).sql)).toBe(
      'coalesce("courier_shifts"."ended_at", greatest("courier_shifts"."started_at", least(now(),' +
        ` coalesce("courier_profiles"."location_updated_at" + interval '2 minutes', "courier_shifts"."started_at"))))`,
    );
  });

  it.each([
    ['delivered', 'desc', 'delivered desc'],
    ['onTimePct', 'asc', 'on_time_pct asc'],
    ['avgDeliveryMin', 'desc', 'avg_delivery_min desc'],
    ['declinedOffers', 'asc', 'declined_offers asc'],
    ['hoursOnline', 'desc', 'hours_online desc'],
    ['name', 'asc', 'name asc'],
  ] as const)(
    'should sort by %s %s with empty values last and the id last',
    (key, direction, order) => {
      expect(flat(couriers(key, direction).sql)).toContain(
        `order by ${order} nulls last, courier_id ${direction} limit $`,
      );
    },
  );

  it('should skip the rows of the earlier pages', () => {
    expect(couriers('delivered', 'desc', 3).params.slice(-2)).toEqual([20, 40]);
  });

  it('should keep couriers with a delivered order, an offer or a shift in the period', () => {
    expect(flat(couriers('delivered', 'desc').sql)).toContain(
      'where done.courier_id is not null or offers.courier_id is not null or shifts.courier_id is not null',
    );
  });
});
