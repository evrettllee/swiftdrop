import type { AnalyticsKpis } from '@/shared/analytics-api';
import { APP_CURRENCY } from '@/shared/config';
import { formatCount, formatMoney } from '@/shared/lib/format';
import { KPI_TEXTS, MANAGER_ANALYTICS_TEXTS } from '../config/texts';
import type { KpiCard } from './kpi-card';
import { searchCard } from './kpi-search';
import { changePercent, formatChange, formatDecimal, formatPercent, ordersWord } from './numbers';

const EMPTY = MANAGER_ANALYTICS_TEXTS.EMPTY;
const REVENUE_DIGITS = 0;

function minutesOf(value: number | null): string {
  return value === null ? EMPTY : KPI_TEXTS.minutes(formatDecimal(value));
}

function moneyOf(value: string | null, digits?: number): string {
  return value === null ? EMPTY : formatMoney(Number(value), APP_CURRENCY, digits);
}

function changeNote(current: number, previous: number): string {
  const change = changePercent(current, previous);

  return change === null
    ? KPI_TEXTS.NO_PREVIOUS
    : `${formatChange(change)} ${KPI_TEXTS.TO_PREVIOUS}`;
}

function deliveredCard({ delivered }: AnalyticsKpis): KpiCard {
  const { current, previous } = delivered;
  const value = formatCount(current.delivered);
  const change = changeNote(current.delivered, previous.delivered);
  const total = formatCount(current.total);

  return {
    id: 'delivered',
    title: KPI_TEXTS.DELIVERED,
    shortTitle: KPI_TEXTS.DELIVERED,
    value,
    shortValue: value,
    note: `${KPI_TEXTS.deliveredOf(total)}, ${change}`,
    shortNote: `${KPI_TEXTS.deliveredOfShort(total)}, ${change}`,
  };
}

function onTimeCard({ onTime }: AnalyticsKpis): KpiCard {
  const { pct, count } = onTime.current;
  const value = formatPercent(pct);

  return {
    id: 'onTime',
    title: KPI_TEXTS.ON_TIME,
    shortTitle: KPI_TEXTS.ON_TIME,
    value,
    shortValue: value,
    note: KPI_TEXTS.onTime(formatCount(count), ordersWord(count)),
    shortNote: KPI_TEXTS.onTimeShort(formatCount(count)),
  };
}

function deliveryTimeCard({ avgDeliveryMin }: AnalyticsKpis): KpiCard {
  const value = minutesOf(avgDeliveryMin.current);
  const previous = avgDeliveryMin.previous;
  const was = previous === null ? null : KPI_TEXTS.was(minutesOf(previous));

  return {
    id: 'avgDeliveryMin',
    title: KPI_TEXTS.DELIVERY_TIME,
    shortTitle: KPI_TEXTS.DELIVERY_TIME_SHORT,
    value,
    shortValue: value,
    note: was === null ? KPI_TEXTS.deliveryTime : `${KPI_TEXTS.deliveryTime}, ${was}`,
    shortNote: was ?? KPI_TEXTS.NO_PREVIOUS,
  };
}

function cancelledCard({ cancelled }: AnalyticsKpis): KpiCard {
  const { pct, count, by } = cancelled.current;
  const value = formatPercent(pct);
  const total = KPI_TEXTS.cancelledCount(formatCount(count), ordersWord(count));
  const parts = [
    [by.client, KPI_TEXTS.BY_CLIENT],
    [by.system, KPI_TEXTS.BY_SYSTEM],
    [by.staff, KPI_TEXTS.BY_STAFF],
  ] as const;
  const shown = parts.filter(([part]) => part > 0).map(([part, who]) => `${part} ${who}`);

  return {
    id: 'cancelled',
    title: KPI_TEXTS.CANCELLED,
    shortTitle: KPI_TEXTS.CANCELLED,
    value,
    shortValue: value,
    note: shown.length === 0 ? total : `${total}: ${shown.join(', ')}`,
    shortNote: total,
  };
}

function revenueCard({ revenue }: AnalyticsKpis): KpiCard {
  const { total, avgCheck } = revenue.current;
  const value = moneyOf(total, REVENUE_DIGITS);
  const check = moneyOf(avgCheck);

  return {
    id: 'revenue',
    title: KPI_TEXTS.REVENUE,
    shortTitle: KPI_TEXTS.REVENUE,
    value,
    shortValue: value,
    note: KPI_TEXTS.avgCheck(check),
    shortNote: KPI_TEXTS.avgCheckShort(check),
  };
}

export function kpiCards(kpis: AnalyticsKpis): KpiCard[] {
  return [deliveredCard, onTimeCard, deliveryTimeCard, cancelledCard, revenueCard, searchCard].map(
    (card) => card(kpis),
  );
}
