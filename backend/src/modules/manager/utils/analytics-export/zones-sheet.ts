import type { DeliveryZoneRow } from '@/common/types/delivery-zone.types';
import { EXPORT_SECTION } from '@/modules/manager/constants/analytics-export.constants';
import type { ExportSheet } from '@/modules/manager/types/manager-export.types';
import { type SheetColumn, shareOf, sheetOf } from './export-sheet';

const COLUMNS: SheetColumn<DeliveryZoneRow>[] = [
  { header: 'Зона', kind: 'text', width: 24, value: (row) => row.name },
  { header: 'Заказов', kind: 'number', width: 10, value: (row) => row.orders },
  {
    header: 'Вовремя %',
    kind: 'percent',
    width: 11,
    value: (row) => shareOf(row.onTime, row.onTimeTotal),
  },
  {
    header: 'Среднее время мин',
    kind: 'decimal',
    width: 18,
    value: (row) => row.averageDeliveryMinutes,
  },
  { header: 'Вручную назначено', kind: 'number', width: 18, value: (row) => row.manualAssigned },
  { header: 'Выручка BYN', kind: 'money', width: 13, value: (row) => row.revenue },
];

export function zonesSheet(rows: readonly DeliveryZoneRow[]): ExportSheet {
  return sheetOf(EXPORT_SECTION.ZONES, COLUMNS, rows);
}
