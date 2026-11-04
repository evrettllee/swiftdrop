import type { AnalyticsHour } from '@/shared/analytics-api';
import { pluralize } from '@/shared/lib/format';
import { CHART } from '../config/analytics';
import { CHART_TEXTS, HOUR_FORMS } from '../config/texts';
import { formatFine, ordersWord } from './numbers';

export function hoursWindow(hours: readonly AnalyticsHour[]): AnalyticsHour[] {
  const active = hours.filter((hour) => hour.avgOrders > 0).map((hour) => hour.hour);
  const from = Math.min(CHART.HOURS_FROM, ...active);
  const to = Math.max(CHART.HOURS_TO, ...active);

  return hours.filter((hour) => hour.hour >= from && hour.hour <= to);
}

function hourAt(hour: number): string {
  return CHART_TEXTS.hourAt(hour, pluralize(hour, HOUR_FORMS));
}

export function perHourText(avgOrders: number): string {
  return CHART_TEXTS.perHour(formatFine(avgOrders), ordersWord(avgOrders));
}

export function hoursSummary(hours: readonly AnalyticsHour[]): string {
  if (!hours.some((hour) => hour.avgOrders > 0)) {
    return CHART_TEXTS.summary(CHART_TEXTS.HOURS, CHART_TEXTS.NO_HOURS);
  }

  const peak = hours.reduce((best, hour) => (hour.avgOrders > best.avgOrders ? hour : best));
  const least = hours.reduce((low, hour) => (hour.avgOrders < low.avgOrders ? hour : low));
  const text = [
    CHART_TEXTS.peak(hourAt(peak.hour), perHourText(peak.avgOrders)),
    CHART_TEXTS.least(hourAt(least.hour), formatFine(least.avgOrders)),
  ].join('; ');

  return CHART_TEXTS.summary(CHART_TEXTS.HOURS, text);
}
