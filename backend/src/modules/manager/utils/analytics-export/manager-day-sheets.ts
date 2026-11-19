import { EXPORT_SECTION } from '@/modules/manager/constants/analytics-export.constants';
import type { AnalyticsDay, AnalyticsHour } from '@/modules/manager/types/manager-analytics.types';
import type { ExportSheet } from '@/modules/manager/types/manager-export.types';
import { type SheetColumn, sheetOf } from './export-sheet';

const DAY_COLUMNS: SheetColumn<AnalyticsDay>[] = [
  { header: 'Дата', kind: 'day', width: 12, value: (row) => row.date },
  { header: 'Доставлены', kind: 'number', width: 12, value: (row) => row.delivered },
  { header: 'Отменены', kind: 'number', width: 11, value: (row) => row.cancelled },
  { header: 'В работе', kind: 'number', width: 10, value: (row) => row.inProgress },
];

const HOUR_COLUMNS: SheetColumn<AnalyticsHour>[] = [
  { header: 'Час', kind: 'text', width: 8, value: (row) => `${row.hour}:00` },
  { header: 'Заказов в час', kind: 'decimal', width: 15, value: (row) => row.avgOrders },
];

export function managerDaysSheet(rows: readonly AnalyticsDay[]): ExportSheet {
  return sheetOf(EXPORT_SECTION.DAYS, DAY_COLUMNS, rows);
}

export function managerHoursSheet(rows: readonly AnalyticsHour[]): ExportSheet {
  return sheetOf(EXPORT_SECTION.HOURS, HOUR_COLUMNS, rows);
}
