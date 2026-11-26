import { TICKET_TOPIC_LABELS } from '@/entities/support-ticket';
import type { SupportAnalytics } from '@/shared/analytics-api';
import { formatDayMonth, formatDayShort } from '@/shared/lib/calendar';
import {
  formatDecimal,
  formatDurationMinutes,
  formatWhole,
  pluralize,
  shareOf,
} from '@/shared/lib/format';
import type { HorizontalBarItem, VerticalBarDatum } from '@/shared/ui/analytics';
import { SUPPORT_TEXTS } from '../config/tab-texts';
import { ADMIN_ANALYTICS_TEXTS as TEXTS, TICKET_FORMS } from '../config/texts';
import type { KpiCardView } from './business-view';
import { buildMeasuredKpi, buildPctKpi } from './kpi-helpers';

export type SupportTabView = {
  kpis: readonly KpiCardView[];
  topicsSubtitle: string;
  topics: readonly HorizontalBarItem[];
  responseBars: readonly VerticalBarDatum[];
};

function buildSupportKpis(data: SupportAnalytics): readonly KpiCardView[] {
  const { ticketsCreated, firstResponseMedianMinutes, unansweredNow, closed } = data.kpis;
  const waitText =
    unansweredNow.longestWaitMinutes === null
      ? SUPPORT_TEXTS.ALL_ANSWERED
      : SUPPORT_TEXTS.longestWait(unansweredNow.longestWaitMinutes);

  return [
    buildMeasuredKpi(
      'created',
      SUPPORT_TEXTS.KPI_CREATED,
      ticketsCreated.value,
      ticketsCreated.previous,
      false,
      formatWhole,
    ),
    buildMeasuredKpi(
      'firstResponse',
      SUPPORT_TEXTS.KPI_FIRST_RESPONSE,
      firstResponseMedianMinutes.value,
      firstResponseMedianMinutes.previous,
      false,
      formatDurationMinutes,
      SUPPORT_TEXTS.MEDIAN,
    ),
    {
      key: 'unanswered',
      label: SUPPORT_TEXTS.KPI_UNANSWERED,
      value: formatWhole(unansweredNow.count),
      change: { tone: 'neutral', text: waitText },
    },
    buildPctKpi(
      'closed',
      SUPPORT_TEXTS.KPI_CLOSED,
      shareOf(closed.value.closed, closed.value.total),
      shareOf(closed.previous.closed, closed.previous.total),
      true,
      TEXTS.ofTotal(formatWhole(closed.value.closed), formatWhole(closed.value.total)),
    ),
  ];
}

export function buildSupportTabView(data: SupportAnalytics): SupportTabView {
  const totalTickets = data.topics.reduce((sum, topic) => sum + topic.count, 0);
  const maxTopicCount = data.topics.reduce((best, topic) => Math.max(best, topic.count), 0);

  return {
    kpis: buildSupportKpis(data),
    topicsSubtitle: SUPPORT_TEXTS.topicsSubtitle(totalTickets),
    topics: data.topics.map((topic) => ({
      key: topic.topic,
      label: TICKET_TOPIC_LABELS[topic.topic],
      count: topic.count,
      sharePct: shareOf(topic.count, totalTickets) ?? 0,
      barWidthPct: shareOf(topic.count, maxTopicCount) ?? 0,
    })),
    responseBars: data.firstResponseByDay.map((day) => ({
      key: day.date,
      xLabel: formatDayShort(day.date),
      value: day.medianMinutes ?? 0,
      tooltipTitle:
        day.medianMinutes === null
          ? `${formatDayMonth(day.date)}: ${SUPPORT_TEXTS.NO_DAY_ANSWER}`
          : `${formatDayMonth(day.date)}: ${formatDecimal(day.medianMinutes)} мин`,
      tooltipSubtitle: `${formatWhole(day.tickets)} ${pluralize(day.tickets, TICKET_FORMS)}`,
    })),
  };
}
