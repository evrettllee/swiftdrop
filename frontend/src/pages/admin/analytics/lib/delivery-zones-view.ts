import type { DeliveryZoneRow } from '@/shared/analytics-api';
import { formatDurationMinutes, formatWhole, shareOf } from '@/shared/lib/format';
import { ADMIN_ANALYTICS_TEXTS as TEXTS } from '../config/texts';

export type ZoneRowView = {
  key: string;
  name: string;
  orders: string;
  onTime: string;
  avgTime: string;
  manual: string;
  revenue: string;
};

export function buildZonesView(rows: readonly DeliveryZoneRow[]): readonly ZoneRowView[] {
  const ordered = [...rows].sort(
    (first, second) =>
      Number(first.zoneId === null) - Number(second.zoneId === null) ||
      second.orders - first.orders ||
      first.name.localeCompare(second.name),
  );

  return ordered.map((row) => {
    const pct = shareOf(row.onTime, row.onTimeTotal);

    return {
      key: row.zoneId === null ? 'none' : String(row.zoneId),
      name: row.name,
      orders: formatWhole(row.orders),
      onTime: pct === null ? TEXTS.EMPTY_CELL : `${pct}%`,
      avgTime:
        row.averageDeliveryMinutes === null
          ? TEXTS.EMPTY_CELL
          : formatDurationMinutes(row.averageDeliveryMinutes),
      manual: formatWhole(row.manualAssigned),
      revenue: formatWhole(Math.round(row.revenue)),
    };
  });
}
