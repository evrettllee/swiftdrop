import type { UsersAnalytics } from '@/shared/analytics-api';
import { formatDayMonth, formatDayShort } from '@/shared/lib/calendar';
import { formatWhole, pluralize, shareOf } from '@/shared/lib/format';
import type { HorizontalBarItem, VerticalBarDatum } from '@/shared/ui/analytics';
import { USERS_TEXTS } from '../config/tab-texts';
import { ADMIN_ANALYTICS_TEXTS as TEXTS, NEW_CLIENT_FORMS } from '../config/texts';
import type { KpiCardView } from './business-view';
import { numericDeltaChange, percentComparisonChange } from './kpi-helpers';

export type UsersTabView = {
  kpis: readonly KpiCardView[];
  clientsBars: readonly VerticalBarDatum[];
  ordersPerClientSubtitle: string;
  ordersPerClient: readonly HorizontalBarItem[];
  repeatSummaryLabel: string;
  repeatSummaryValue: string;
};

function buildUsersKpis(data: UsersAnalytics, isWeekPreset: boolean): readonly KpiCardView[] {
  const { newClients, activeClients, repeatClients, couriersOnline, averageDeliveriesPerCourier } =
    data.kpis;
  const repeatPct = shareOf(repeatClients.value.repeat, repeatClients.value.active);
  const prevRepeatPct = shareOf(repeatClients.previous.repeat, repeatClients.previous.active);

  return [
    {
      key: 'newClients',
      label: USERS_TEXTS.KPI_NEW_CLIENTS,
      value: formatWhole(newClients.value),
      change: percentComparisonChange(newClients.value, newClients.previous, isWeekPreset, true),
    },
    {
      key: 'activeClients',
      label: USERS_TEXTS.KPI_ACTIVE_CLIENTS,
      value: formatWhole(activeClients.value),
      change: percentComparisonChange(
        activeClients.value,
        activeClients.previous,
        isWeekPreset,
        true,
      ) ?? { tone: 'neutral', text: USERS_TEXTS.ACTIVE_HINT },
    },
    {
      key: 'repeatClients',
      label: USERS_TEXTS.KPI_REPEAT_CLIENTS,
      value: repeatPct === null ? TEXTS.NO_DATA : `${repeatPct}%`,
      change: numericDeltaChange(repeatPct, prevRepeatPct, true, null, (prev) => `${prev}%`),
    },
    {
      key: 'couriersOnline',
      label: USERS_TEXTS.KPI_COURIERS_ONLINE,
      value: TEXTS.ofTotal(formatWhole(couriersOnline.onShift), formatWhole(couriersOnline.total)),
      change: {
        tone: 'neutral',
        text: USERS_TEXTS.couriersNote(averageDeliveriesPerCourier.value),
      },
    },
  ];
}

function buildOrderBuckets(
  buckets: UsersAnalytics['ordersPerClient'],
): readonly HorizontalBarItem[] {
  const raw = [
    { key: 'one', label: USERS_TEXTS.BUCKET_ONE, count: buckets.one },
    { key: 'two', label: USERS_TEXTS.BUCKET_TWO, count: buckets.two },
    { key: 'threeToFive', label: USERS_TEXTS.BUCKET_THREE_TO_FIVE, count: buckets.threeToFive },
    { key: 'sixPlus', label: USERS_TEXTS.BUCKET_SIX_PLUS, count: buckets.sixPlus },
  ];
  const total = raw.reduce((sum, item) => sum + item.count, 0);
  const max = raw.reduce((best, item) => Math.max(best, item.count), 0);

  return raw.map((item) => ({
    ...item,
    sharePct: shareOf(item.count, total) ?? 0,
    barWidthPct: shareOf(item.count, max) ?? 0,
  }));
}

export function buildUsersTabView(data: UsersAnalytics, isWeekPreset: boolean): UsersTabView {
  const clientsBars: VerticalBarDatum[] = data.newClientsByDay.map((day) => ({
    key: day.date,
    xLabel: formatDayShort(day.date),
    value: day.count,
    tooltipTitle: `${formatDayMonth(day.date)}: ${formatWhole(day.count)}`,
    tooltipSubtitle: pluralize(day.count, NEW_CLIENT_FORMS),
  }));
  const repeat = data.kpis.repeatClients.value;
  const repeatPct = shareOf(repeat.repeat, repeat.active);

  return {
    kpis: buildUsersKpis(data, isWeekPreset),
    clientsBars,
    ordersPerClientSubtitle: USERS_TEXTS.ordersPerClientSubtitle(data.kpis.activeClients.value),
    ordersPerClient: buildOrderBuckets(data.ordersPerClient),
    repeatSummaryLabel: USERS_TEXTS.REPEAT_SUMMARY,
    repeatSummaryValue:
      repeatPct === null
        ? formatWhole(repeat.repeat)
        : `${formatWhole(repeat.repeat)} · ${repeatPct}%`,
  };
}
