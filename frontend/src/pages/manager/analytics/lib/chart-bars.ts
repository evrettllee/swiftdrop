import type { AnalyticsDay, AnalyticsHour } from '@/shared/analytics-api';
import { formatCount } from '@/shared/lib/format';
import { AXIS_LABELS_MAX } from '../config/analytics';
import { CHART_TEXTS } from '../config/texts';
import { dayLabel, dayText, dayTotal } from './days';
import { perHourText } from './hours';
import { formatDayMonth } from './period';
import { labelStep } from './scale';

export type BarSegmentKind = 'delivered' | 'cancelled' | 'progress';

export type BarData = {
  key: string;
  axisLabel: string;
  text: string;
  tip: { title: string; lines: readonly string[] };
  total: number;
  segments: readonly { kind: BarSegmentKind; value: number }[];
};

export function dayBars(days: readonly AnalyticsDay[], isDesktop: boolean): BarData[] {
  const step = labelStep(
    days.length,
    isDesktop ? AXIS_LABELS_MAX.DAYS_DESKTOP : AXIS_LABELS_MAX.DAYS_PHONE,
  );

  return days.map((day, index) => ({
    key: day.date,
    axisLabel: index % step === 0 ? dayLabel(day.date, isDesktop) : '',
    text: dayText(day),
    tip: {
      title: formatDayMonth(day.date),
      lines: [
        `${CHART_TEXTS.DELIVERED}: ${formatCount(day.delivered)}`,
        `${CHART_TEXTS.CANCELLED}: ${formatCount(day.cancelled)}`,
        `${CHART_TEXTS.IN_PROGRESS}: ${formatCount(day.inProgress)}`,
      ],
    },
    total: dayTotal(day),
    segments: [
      { kind: 'delivered', value: day.delivered },
      { kind: 'cancelled', value: day.cancelled },
      { kind: 'progress', value: day.inProgress },
    ],
  }));
}

export function hourBars(hours: readonly AnalyticsHour[], isDesktop: boolean): BarData[] {
  const step = labelStep(
    hours.length,
    isDesktop ? AXIS_LABELS_MAX.HOURS_DESKTOP : AXIS_LABELS_MAX.HOURS_PHONE,
  );

  return hours.map((hour, index) => {
    const title = CHART_TEXTS.hourOf(hour.hour);
    const value = perHourText(hour.avgOrders);

    return {
      key: String(hour.hour),
      axisLabel: index % step === 0 ? String(hour.hour) : '',
      text: `${title}: ${value}`,
      tip: { title, lines: [value] },
      total: hour.avgOrders,
      segments: [{ kind: 'delivered', value: hour.avgOrders }],
    };
  });
}
