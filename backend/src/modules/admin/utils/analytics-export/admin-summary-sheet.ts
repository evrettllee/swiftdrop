import {
  EXPORT_SECTION,
  EXPORT_SHEET_NAMES,
} from '@/modules/manager/constants/analytics-export.constants';
import type {
  ExportCell,
  ExportColumn,
  ExportSheet,
} from '@/modules/manager/types/manager-export.types';
import { periodText, typed } from '@/modules/manager/utils/analytics-export/export-sheet';
import type { AdminSummaryInput } from '@/modules/admin/types/admin-analytics-export.types';
import { SUMMARY_LINES, type SummaryLine } from './admin-summary-lines';

const COLUMNS: ExportColumn[] = [
  { header: 'Раздел', kind: 'text', width: 14 },
  { header: 'Показатель', kind: 'text', width: 32 },
  { header: 'Значение', kind: 'number', width: 24 },
  { header: 'Предыдущий период', kind: 'number', width: 24 },
];

function lineRow(line: SummaryLine, input: AdminSummaryInput): ExportCell[] {
  const value = line.value(input);
  const compared = typeof value === 'object' && value !== null;

  return [
    line.section,
    line.label,
    typed(compared ? value.value : value, line.kind),
    compared ? typed(value.previous, line.kind) : null,
  ];
}

export function adminSummarySheet(input: AdminSummaryInput): ExportSheet {
  const { from, to, previousFrom, previousTo } = input.period;
  const rows: ExportCell[][] = [
    [null, 'Период', periodText(from, to), null],
    [null, 'Сравнение с', periodText(previousFrom, previousTo), null],
    ...SUMMARY_LINES.map((line) => lineRow(line, input)),
  ];

  return { name: EXPORT_SHEET_NAMES[EXPORT_SECTION.SUMMARY], table: { columns: COLUMNS, rows } };
}
