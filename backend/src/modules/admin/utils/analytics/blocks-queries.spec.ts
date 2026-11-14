import { type SQL, sql } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { resolveAnalyticsPeriod } from '@/modules/manager/utils/analytics-period';
import { medianSql, minutesBetweenSql } from './analytics-sql';
import { recentFailuresSql, serviceKpiSql, servicesSql } from './service-queries';
import { firstResponseByDaySql, supportKpiSql } from './support-queries';
import { usersKpiSql } from './users-queries';

const dialect = new PgDialect({ casing: 'snake_case' });
const render = (query: SQL) => dialect.sqlToQuery(query);
const flat = (query: SQL) => render(query).sql.replace(/\s+/g, ' ');
const NOW = new Date('2026-10-08T12:00:00Z');
const period = resolveAnalyticsPeriod({ from: '2026-10-01', to: '2026-10-07' }, NOW, APP_TIME_ZONE);

describe('admin analytics block queries', () => {
  it('should take the continuous median rounded to a tenth', () => {
    expect(flat(medianSql(sql`x`))).toBe(
      'round((percentile_cont(0.5) within group (order by x))::numeric, 1)::float8',
    );
    expect(flat(minutesBetweenSql(sql`a`, sql`b`))).toBe('extract(epoch from b - a) / 60');
  });

  it('should measure the first response from the creation of the ticket by stored columns', () => {
    for (const query of [
      supportKpiSql(period, NOW),
      firstResponseByDaySql(period.current, 'UTC'),
    ]) {
      const text = flat(query);

      expect(text).toContain(
        'extract(epoch from "support_tickets"."first_response_at" - "support_tickets"."created_at") / 60',
      );
      expect(text).not.toContain('"messages"');
    }
  });

  it('should count waiting tickets against the given clock', () => {
    const { sql: text, params } = render(supportKpiSql(period, NOW));

    expect(text).toContain(`"support_tickets"."first_response_at" is null`);
    expect(params).toContain(NOW);
  });

  it('should place a failure in the period of its last time and sum its repeats', () => {
    for (const query of [serviceKpiSql(period), servicesSql(period.current)]) {
      const text = flat(query);

      expect(text).toContain('"service_failures"."last_at" >= $');
      expect(text).toContain('sum("service_failures"."repeats")');
      expect(text).not.toContain('"first_at" >=');
    }
  });

  it('should give the newest failures first, at most twenty', () => {
    const { sql: text, params } = render(recentFailuresSql(period.current));

    expect(text.replace(/\s+/g, ' ')).toContain(
      'order by "service_failures"."last_at" desc, "service_failures"."failure_id" desc limit $',
    );
    expect(params.at(-1)).toBe(20);
  });

  it('should count online only couriers who can sign in', () => {
    const text = flat(usersKpiSql(period));

    expect(text).toContain(
      'not "users"."is_blocked" and "users"."deleted_at" is null and "users"."password_hash" is not null',
    );
  });
});
