import { type SQL, sql } from 'drizzle-orm';
import { SERVICE_FAILURE_CODE } from '@/common/constants/service-failure-codes.constants';
import { SERVICE_NAME } from '@/common/enums/service-name.enum';
import { serviceFailures } from '@/database/schema';
import { sqlLiteral } from '@/database/sql-literal';
import type {
  AnalyticsPeriod,
  AnalyticsRange,
} from '@/modules/manager/types/manager-analytics.types';
import { isoSql, localDateSql, PERIODS } from './analytics-sql';

export const RECENT_FAILURES_LIMIT = 20;

const SERVER = sqlLiteral(SERVICE_NAME.SERVER);
const repeatsWhere = (condition: SQL) =>
  sql`coalesce(sum(${serviceFailures.repeats}) filter (where ${condition}), 0)::int`;
const lastIn = (start: Date, end: Date) =>
  sql`${serviceFailures.lastAt} >= ${start} and ${serviceFailures.lastAt} < ${end}`;

export function serviceKpiSql({ current, previous }: AnalyticsPeriod): SQL {
  const isMail = sql`${serviceFailures.service} = ${sqlLiteral(SERVICE_NAME.MAIL)}`;
  const savedRate = sql`${serviceFailures.service} = ${sqlLiteral(SERVICE_NAME.NBRB)}
    and ${serviceFailures.code} = ${sqlLiteral(SERVICE_FAILURE_CODE.nbrb.SAVED_RATE_USED)}`;

  return sql`with failures as (
      select ${serviceFailures.lastAt} >= ${current.start} as is_current,
        ${repeatsWhere(sql`${serviceFailures.service} = ${SERVER}`)} as server_errors,
        ${repeatsWhere(sql`${serviceFailures.service} <> ${SERVER}`)} as external,
        (count(distinct ${serviceFailures.service}) filter (where ${serviceFailures.service} <> ${SERVER}))::int as services,
        ${repeatsWhere(isMail)} as mail,
        max(${serviceFailures.lastAt}) filter (where ${isMail}) as mail_last_at,
        ${repeatsWhere(savedRate)} as saved_rate
      from ${serviceFailures}
      where ${lastIn(previous.start, current.end)}
      group by 1
    )
    select periods.is_current as "isCurrent",
      coalesce(failures.server_errors, 0) as "serverErrors",
      coalesce(failures.external, 0) as "externalFailures",
      coalesce(failures.services, 0) as "externalServices",
      coalesce(failures.mail, 0) as "mailFailures",
      ${isoSql(sql`failures.mail_last_at`)} as "mailLastAt",
      coalesce(failures.saved_rate, 0) as "savedRateUsed"
    from ${PERIODS}
    left join failures on failures.is_current = periods.is_current`;
}

export function serverErrorsByDaySql({ start, end }: AnalyticsRange, timeZone: string): SQL {
  return sql`select ${localDateSql(sql`${serviceFailures.lastAt}`, timeZone)} as "date",
      sum(${serviceFailures.repeats})::int as "count"
    from ${serviceFailures}
    where ${serviceFailures.service} = ${SERVER} and ${lastIn(start, end)}
    group by 1`;
}

export function servicesSql({ start, end }: AnalyticsRange): SQL {
  return sql`select distinct on (${serviceFailures.service}) ${serviceFailures.service} as "service",
      (sum(${serviceFailures.repeats}) over (partition by ${serviceFailures.service}))::int as "failures",
      ${isoSql(sql`${serviceFailures.lastAt}`)} as "lastAt",
      ${serviceFailures.code} as "lastCode"
    from ${serviceFailures}
    where ${serviceFailures.service} <> ${SERVER} and ${lastIn(start, end)}
    order by ${serviceFailures.service}, ${serviceFailures.lastAt} desc, ${serviceFailures.failureId} desc`;
}

export function recentFailuresSql({ start, end }: AnalyticsRange): SQL {
  return sql`select ${isoSql(sql`${serviceFailures.lastAt}`)} as "lastAt",
      ${isoSql(sql`${serviceFailures.firstAt}`)} as "firstAt",
      ${serviceFailures.service} as "service", ${serviceFailures.code} as "code",
      ${serviceFailures.message} as "message", ${serviceFailures.repeats} as "repeats"
    from ${serviceFailures}
    where ${lastIn(start, end)}
    order by ${serviceFailures.lastAt} desc, ${serviceFailures.failureId} desc
    limit ${RECENT_FAILURES_LIMIT}`;
}
