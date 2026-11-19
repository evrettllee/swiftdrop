import {
  EXPORT_SHEET_NAMES,
  type ExportSection,
} from '@/modules/manager/constants/analytics-export.constants';
import { PERCENT_SCALE } from '@/modules/manager/constants/manager-export.constants';
import type {
  ExportCell,
  ExportCellKind,
  ExportColumn,
  ExportSheet,
  ExportTypedCell,
} from '@/modules/manager/types/manager-export.types';
import { formatDay } from '../export-cells';

export type SheetColumn<T> = ExportColumn & { value: (row: T) => ExportCell };

export function sheetOf<T>(
  section: ExportSection,
  columns: readonly SheetColumn<T>[],
  rows: readonly T[],
): ExportSheet {
  return {
    name: EXPORT_SHEET_NAMES[section],
    table: {
      columns: columns.map(({ header, kind, width }) => ({ header, kind, width })),
      rows: rows.map((row) => columns.map((column) => column.value(row))),
    },
  };
}

export function shareOf(part: number, total: number): number | null {
  return total === 0 ? null : part / total;
}

export function fromPercent(percent: number | null): number | null {
  return percent === null ? null : percent / PERCENT_SCALE;
}

export function moneyOf(amount: string | null): number | null {
  return amount === null ? null : Number(amount);
}

export function typed(value: number | null, kind: ExportCellKind): ExportTypedCell {
  return { value, kind };
}

export function periodText(from: string, to: string): string {
  return `${formatDay(from)} – ${formatDay(to)}`;
}
