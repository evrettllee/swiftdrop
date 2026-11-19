import { type SQL, sql } from 'drizzle-orm';
import { SUPPORT_TICKET_STATUS } from '@/common/enums/support-ticket.enum';
import { supportTickets } from '@/database/schema';
import { sqlLiteral } from '@/database/sql-literal';
import type {
  AnalyticsPeriod,
  AnalyticsRange,
} from '@/modules/manager/types/manager-analytics.types';
import { localDateSql, medianSql, minutesBetweenSql, PERIODS } from './analytics-sql';

const RESPONSE_MINUTES = minutesBetweenSql(
  sql`${supportTickets.createdAt}`,
  sql`${supportTickets.firstResponseAt}`,
);

const createdIn = (start: Date, end: Date) =>
  sql`${supportTickets.createdAt} >= ${start} and ${supportTickets.createdAt} < ${end}`;

export function supportKpiSql({ current, previous }: AnalyticsPeriod, now: Date): SQL {
  return sql`with created as (
      select ${supportTickets.createdAt} >= ${current.start} as is_current, count(*)::int as total,
        (count(*) filter (where ${supportTickets.status} = ${sqlLiteral(SUPPORT_TICKET_STATUS.CLOSED)}))::int as closed,
        ${medianSql(RESPONSE_MINUTES)} as median_minutes
      from ${supportTickets}
      where ${createdIn(previous.start, current.end)}
      group by 1
    ),
    unanswered as (
      select count(*)::int as total,
        floor(${minutesBetweenSql(sql`min(${supportTickets.createdAt})`, sql`${now}::timestamptz`)})::int as longest
      from ${supportTickets}
      where ${supportTickets.status} = ${sqlLiteral(SUPPORT_TICKET_STATUS.OPEN)}
        and ${supportTickets.firstResponseAt} is null
    )
    select periods.is_current as "isCurrent",
      coalesce(created.total, 0) as "ticketsCreated",
      coalesce(created.closed, 0) as "closed",
      created.median_minutes as "firstResponseMedianMinutes",
      unanswered.total as "unanswered",
      unanswered.longest as "longestWaitMinutes"
    from ${PERIODS}
    cross join unanswered
    left join created on created.is_current = periods.is_current`;
}

export function supportTopicsSql({ start, end }: AnalyticsRange): SQL {
  return sql`select ${supportTickets.topic} as "topic", count(*)::int as "count"
    from ${supportTickets}
    where ${createdIn(start, end)}
    group by 1`;
}

export function firstResponseByDaySql({ start, end }: AnalyticsRange, timeZone: string): SQL {
  return sql`select ${localDateSql(sql`${supportTickets.createdAt}`, timeZone)} as "date",
      ${medianSql(RESPONSE_MINUTES)} as "medianMinutes",
      count(*)::int as "tickets"
    from ${supportTickets}
    where ${createdIn(start, end)}
    group by 1`;
}
