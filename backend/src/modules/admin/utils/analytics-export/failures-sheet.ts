import { failureText, SERVICE_LABELS } from '@/common/constants/service-failure-texts.constants';
import { EXPORT_SECTION } from '@/modules/manager/constants/analytics-export.constants';
import type { ExportSheet } from '@/modules/manager/types/manager-export.types';
import { type SheetColumn, sheetOf } from '@/modules/manager/utils/analytics-export/export-sheet';
import type { RecentFailure } from '@/modules/admin/types/admin-analytics.types';

const COLUMNS: SheetColumn<RecentFailure>[] = [
  { header: 'Первый раз', kind: 'date', width: 17, value: (row) => new Date(row.firstAt) },
  { header: 'Последний раз', kind: 'date', width: 17, value: (row) => new Date(row.lastAt) },
  { header: 'Сервис', kind: 'text', width: 18, value: (row) => SERVICE_LABELS[row.service] },
  {
    header: 'Что случилось',
    kind: 'text',
    width: 40,
    value: (row) => failureText(row.service, row.code),
  },
  { header: 'Сообщение', kind: 'text', width: 40, value: (row) => row.message },
  { header: 'Повторов', kind: 'number', width: 10, value: (row) => row.repeats },
];

export function failuresSheet(rows: readonly RecentFailure[]): ExportSheet {
  return sheetOf(EXPORT_SECTION.FAILURES, COLUMNS, rows);
}
