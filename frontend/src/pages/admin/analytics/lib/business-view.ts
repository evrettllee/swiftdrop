import type { BusinessAnalytics } from '@/shared/analytics-api';
import { APP_CURRENCY } from '@/shared/config';
import { formatDayMonth, formatDayShort } from '@/shared/lib/calendar';
import { formatMoney, formatWhole, pluralize, shareOf } from '@/shared/lib/format';
import type { HorizontalBarItem, KpiChange, VerticalBarDatum } from '@/shared/ui/analytics';
import { BUSINESS_TEXTS } from '../config/tab-texts';
import {
  ADMIN_ANALYTICS_TEXTS as TEXTS,
  DELIVERED_ORDER_FORMS,
  ORDER_FORMS,
} from '../config/texts';
import {
  buildMeasuredKpi,
  comparisonTone,
  formatMoneyCompact,
  percentComparisonChange,
} from './kpi-helpers';

const MONEY_DIGITS = 2;

export type KpiCardView = { key: string; label: string; value: string; change: KpiChange | null };
export type LossRowView = { key: string; label: string; count: number };
export type BusinessTabView = {
  kpis: readonly KpiCardView[];
  funnel: readonly HorizontalBarItem[];
  losses: readonly LossRowView[];
  revenueAriaLabel: string;
  revenueBars: readonly VerticalBarDatum[];
};

function buildBusinessKpis(
  { kpis }: BusinessAnalytics,
  isWeekPreset: boolean,
): readonly KpiCardView[] {
  const { ordersCreated, revenue, averageCheck, refunds } = kpis;
  const refundDelta = refunds.value.orders - refunds.previous.orders;

  return [
    {
      key: 'ordersCreated',
      label: BUSINESS_TEXTS.KPI_ORDERS,
      value: formatWhole(ordersCreated.value),
      change: percentComparisonChange(
        ordersCreated.value,
        ordersCreated.previous,
        isWeekPreset,
        true,
      ),
    },
    {
      key: 'revenue',
      label: BUSINESS_TEXTS.KPI_REVENUE,
      value: formatMoneyCompact(revenue.value),
      change: percentComparisonChange(
        revenue.value,
        revenue.previous,
        isWeekPreset,
        true,
        formatMoneyCompact,
      ),
    },
    buildMeasuredKpi(
      'averageCheck',
      BUSINESS_TEXTS.KPI_AVG_CHECK,
      averageCheck.value,
      averageCheck.previous,
      true,
      (val) => formatMoney(val, APP_CURRENCY, MONEY_DIGITS),
    ),
    {
      key: 'refunds',
      label: BUSINESS_TEXTS.KPI_REFUNDS,
      value: formatMoney(refunds.value.amount, APP_CURRENCY, MONEY_DIGITS),
      change: {
        direction: refundDelta > 0 ? 'up' : refundDelta < 0 ? 'down' : undefined,
        tone: comparisonTone(refundDelta, false),
        text: `${formatWhole(refunds.value.orders)} ${pluralize(refunds.value.orders, ORDER_FORMS)}, ${TEXTS.was(formatWhole(refunds.previous.orders))}`,
      },
    },
  ];
}

function buildFunnel(funnel: BusinessAnalytics['funnel']): readonly HorizontalBarItem[] {
  return [
    { key: 'created', label: BUSINESS_TEXTS.STAGE_CREATED, count: funnel.created },
    { key: 'paid', label: BUSINESS_TEXTS.STAGE_PAID, count: funnel.paid },
    { key: 'assigned', label: BUSINESS_TEXTS.STAGE_ASSIGNED, count: funnel.courierAssigned },
    { key: 'delivered', label: BUSINESS_TEXTS.STAGE_DELIVERED, count: funnel.delivered },
  ].map((stage) => {
    const share = shareOf(stage.count, funnel.created) ?? 0;

    return { ...stage, sharePct: share, barWidthPct: share };
  });
}

function buildLosses(losses: BusinessAnalytics['losses']): readonly LossRowView[] {
  const after = losses.cancelledAfterPayment;

  return [
    { key: 'unpaid', label: BUSINESS_TEXTS.LOSS_UNPAID, count: losses.unpaidExpired },
    {
      key: 'cancelledBefore',
      label: BUSINESS_TEXTS.LOSS_CANCELLED_BEFORE,
      count: losses.cancelledBeforePayment,
    },
    {
      key: 'cancelledAfter',
      label: BUSINESS_TEXTS.lossCancelledAfter(after.client, after.system, after.staff),
      count: after.client + after.system + after.staff,
    },
    { key: 'inProgress', label: BUSINESS_TEXTS.LOSS_IN_PROGRESS, count: losses.inProgress },
  ];
}

export function buildBusinessTabView(
  data: BusinessAnalytics,
  isWeekPreset: boolean,
): BusinessTabView {
  const firstDay = data.revenueByDay[0];
  const extremes = data.revenueByDay.reduce(
    (acc, day) => ({
      min: day.revenue < acc.min.revenue ? day : acc.min,
      max: day.revenue > acc.max.revenue ? day : acc.max,
      total: acc.total + day.revenue,
    }),
    { min: firstDay, max: firstDay, total: 0 },
  );

  return {
    kpis: buildBusinessKpis(data, isWeekPreset),
    funnel: buildFunnel(data.funnel),
    losses: buildLosses(data.losses),
    revenueAriaLabel:
      firstDay === undefined
        ? BUSINESS_TEXTS.REVENUE_TITLE
        : BUSINESS_TEXTS.revenueAria(
            `${formatMoneyCompact(extremes.min.revenue)} ${formatDayMonth(extremes.min.date)}`,
            `${formatMoneyCompact(extremes.max.revenue)} ${formatDayMonth(extremes.max.date)}`,
            formatMoneyCompact(extremes.total),
          ),
    revenueBars: data.revenueByDay.map((day) => ({
      key: day.date,
      xLabel: formatDayShort(day.date),
      value: day.revenue,
      tooltipTitle: `${formatDayMonth(day.date)}: ${formatMoneyCompact(day.revenue)}`,
      tooltipSubtitle: `${formatWhole(day.delivered)} ${pluralize(day.delivered, DELIVERED_ORDER_FORMS)}`,
    })),
  };
}
