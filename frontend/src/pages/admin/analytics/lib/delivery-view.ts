import type { DeliveryAnalytics } from '@/shared/analytics-api';
import { formatDayMonth, formatDayShort } from '@/shared/lib/calendar';
import {
  formatDecimal,
  formatDurationMinutes,
  formatDurationSeconds,
  formatWhole,
  shareOf,
} from '@/shared/lib/format';
import type { HorizontalBarItem, LineChartDatum } from '@/shared/ui/analytics';
import { DELIVERY_TEXTS } from '../config/tab-texts';
import { ADMIN_ANALYTICS_TEXTS as TEXTS } from '../config/texts';
import type { KpiCardView } from './business-view';
import { buildZonesView, type ZoneRowView } from './delivery-zones-view';
import { buildMeasuredKpi, buildPctKpi } from './kpi-helpers';

export type { ZoneRowView };

export type DeliveryTabView = {
  kpis: readonly KpiCardView[];
  onTimePoints: readonly LineChartDatum[];
  offersSubtitle: string;
  offers: readonly HorizontalBarItem[];
  offersSummary: readonly { key: string; label: string; value: string }[];
  zones: readonly ZoneRowView[];
};

function buildDeliveryKpis(data: DeliveryAnalytics): readonly KpiCardView[] {
  const { onTimeRate, averageDeliveryMinutes, autoAssignedRate, averageSearchSeconds } = data.kpis;
  const autoTotal = autoAssignedRate.value.auto + autoAssignedRate.value.manual;
  const prevAutoTotal = autoAssignedRate.previous.auto + autoAssignedRate.previous.manual;

  return [
    buildPctKpi(
      'onTime',
      DELIVERY_TEXTS.KPI_ON_TIME,
      shareOf(onTimeRate.value.onTime, onTimeRate.value.total),
      shareOf(onTimeRate.previous.onTime, onTimeRate.previous.total),
      true,
      TEXTS.ofTotal(formatWhole(onTimeRate.value.onTime), formatWhole(onTimeRate.value.total)),
    ),
    buildMeasuredKpi(
      'avgDelivery',
      DELIVERY_TEXTS.KPI_AVG_TIME,
      averageDeliveryMinutes.value,
      averageDeliveryMinutes.previous,
      false,
      formatDurationMinutes,
      DELIVERY_TEXTS.PAID_TO_DELIVERY,
      formatDecimal,
    ),
    buildPctKpi(
      'autoAssigned',
      DELIVERY_TEXTS.KPI_AUTO_ASSIGNED,
      shareOf(autoAssignedRate.value.auto, autoTotal),
      shareOf(autoAssignedRate.previous.auto, prevAutoTotal),
      true,
      DELIVERY_TEXTS.manualOrders(autoAssignedRate.value.manual),
    ),
    buildMeasuredKpi(
      'search',
      DELIVERY_TEXTS.KPI_SEARCH,
      averageSearchSeconds.value,
      averageSearchSeconds.previous,
      false,
      formatDurationSeconds,
      DELIVERY_TEXTS.IN_AVERAGE,
    ),
  ];
}

export function buildDeliveryTabView(data: DeliveryAnalytics): DeliveryTabView {
  const { offers } = data;
  const { auto, manual } = data.kpis.autoAssignedRate.value;

  return {
    kpis: buildDeliveryKpis(data),
    onTimePoints: data.onTimeByDay.map((day) => {
      const pct = shareOf(day.onTime, day.total);

      return {
        key: day.date,
        xLabel: formatDayShort(day.date),
        value: pct,
        tooltipTitle:
          pct === null ? formatDayMonth(day.date) : `${formatDayMonth(day.date)}: ${pct}%`,
        tooltipSubtitle: `${TEXTS.ofTotal(formatWhole(day.onTime), formatWhole(day.total))} вовремя`,
      };
    }),
    offersSubtitle: DELIVERY_TEXTS.offersSubtitle(
      offers.total,
      offers.orders,
      offers.maxDeclinesBeforeManual,
    ),
    offers: [
      { key: 'accepted', label: DELIVERY_TEXTS.OFFER_ACCEPTED, count: offers.accepted },
      { key: 'declined', label: DELIVERY_TEXTS.OFFER_DECLINED, count: offers.declined },
      { key: 'expired', label: DELIVERY_TEXTS.OFFER_EXPIRED, count: offers.expired },
    ].map((item) => {
      const pct = shareOf(item.count, offers.total) ?? 0;

      return { ...item, sharePct: pct, barWidthPct: pct };
    }),
    offersSummary: [
      {
        key: 'auto',
        label: DELIVERY_TEXTS.AUTO_SUMMARY,
        value: TEXTS.ofTotal(formatWhole(auto), formatWhole(auto + manual)),
      },
      { key: 'manual', label: DELIVERY_TEXTS.MANUAL_SUMMARY, value: formatWhole(manual) },
    ],
    zones: buildZonesView(data.zones),
  };
}
