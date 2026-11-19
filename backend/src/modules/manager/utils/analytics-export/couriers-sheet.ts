import { shortPersonName } from '@/common/utils/person-name';
import { EXPORT_SECTION } from '@/modules/manager/constants/analytics-export.constants';
import { VEHICLE_TYPE_LABELS } from '@/modules/manager/constants/manager-labels.constants';
import type { AnalyticsCourierExportRow } from '@/modules/manager/types/manager-analytics.types';
import type { ExportSheet } from '@/modules/manager/types/manager-export.types';
import { fromPercent, type SheetColumn, sheetOf } from './export-sheet';

const COLUMNS: SheetColumn<AnalyticsCourierExportRow>[] = [
  {
    header: 'Курьер',
    kind: 'text',
    width: 22,
    value: (row) => shortPersonName(row.firstName, row.lastName),
  },
  {
    header: 'Транспорт',
    kind: 'text',
    width: 13,
    value: (row) => (row.vehicleType === null ? null : VEHICLE_TYPE_LABELS[row.vehicleType]),
  },
  { header: 'Доставок', kind: 'number', width: 10, value: (row) => row.delivered },
  { header: 'Вовремя %', kind: 'percent', width: 11, value: (row) => fromPercent(row.onTimePct) },
  { header: 'Среднее время мин', kind: 'decimal', width: 18, value: (row) => row.avgDeliveryMin },
  {
    header: 'Отказы от предложений',
    kind: 'number',
    width: 22,
    value: (row) => row.declinedOffers,
  },
  { header: 'Часов на линии', kind: 'decimal', width: 15, value: (row) => row.hoursOnline },
];

export function couriersSheet(rows: readonly AnalyticsCourierExportRow[]): ExportSheet {
  return sheetOf(EXPORT_SECTION.COURIERS, COLUMNS, rows);
}
