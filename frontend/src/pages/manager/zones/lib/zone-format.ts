import { APP_LOCALE } from '@/shared/config';
import { formatShortDate, formatShortDay } from '@/shared/lib/format';
import type { ManagerZone } from '@/shared/staff-api';
import { ZONE_ROW_TEXTS } from '../config/texts';

const areaFormat = new Intl.NumberFormat(APP_LOCALE, { maximumFractionDigits: 2 });

export function zoneArea(zone: ManagerZone): string {
  return ZONE_ROW_TEXTS.area(areaFormat.format(zone.areaKm2));
}

export function zoneUpdated(zone: ManagerZone): string {
  return formatShortDate(new Date(zone.updatedAt));
}

export function zoneUpdatedDay(zone: ManagerZone): string {
  return formatShortDay(new Date(zone.updatedAt));
}
