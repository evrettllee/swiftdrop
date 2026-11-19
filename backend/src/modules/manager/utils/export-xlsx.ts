import ExcelJS from 'exceljs';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { wallClock, wallClockAsUtc } from '@/common/utils/wall-clock';
import {
  XLSX_DATE_FORMAT,
  XLSX_DAY_FORMAT,
  XLSX_DECIMAL_FORMAT,
  XLSX_MONEY_FORMAT,
  XLSX_PERCENT_FORMAT,
  XLSX_SHEET_NAME,
} from '../constants/manager-export.constants';
import type {
  ExportCell,
  ExportCellKind,
  ExportSheet,
  ExportTable,
} from '../types/manager-export.types';
import { cellKindOf, dayAsDate, isTypedCell, plainCell } from './export-cells';

const HEADER_ROW = 1;
const FIRST_COLUMN = 1;

const NUMBER_FORMATS: Partial<Record<ExportCellKind, string>> = {
  date: XLSX_DATE_FORMAT,
  day: XLSX_DAY_FORMAT,
  money: XLSX_MONEY_FORMAT,
  percent: XLSX_PERCENT_FORMAT,
  decimal: XLSX_DECIMAL_FORMAT,
};

function cellValue(cell: ExportCell, columnKind: ExportCellKind): ExcelJS.CellValue {
  const value = plainCell(cell);

  if (value instanceof Date) {
    return wallClockAsUtc(wallClock(value, APP_TIME_ZONE));
  }

  return typeof value === 'string' && cellKindOf(cell, columnKind) === 'day'
    ? dayAsDate(value)
    : value;
}

function addSheet(
  workbook: ExcelJS.Workbook,
  { name, table }: ExportSheet,
  withFilter: boolean,
): void {
  const { columns, rows } = table;
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: HEADER_ROW }] });

  sheet.columns = columns.map(({ header, kind, width }) => ({
    header,
    width,
    style: NUMBER_FORMATS[kind] ? { numFmt: NUMBER_FORMATS[kind] } : {},
  }));
  sheet.getRow(HEADER_ROW).font = { bold: true };

  if (withFilter) {
    sheet.autoFilter = {
      from: { row: HEADER_ROW, column: FIRST_COLUMN },
      to: { row: HEADER_ROW, column: columns.length },
    };
  }

  for (const row of rows) {
    const added = sheet.addRow(row.map((cell, index) => cellValue(cell, columns[index].kind)));

    row.forEach((cell, index) => {
      const format = isTypedCell(cell) ? NUMBER_FORMATS[cell.kind] : undefined;

      if (format) {
        added.getCell(index + FIRST_COLUMN).numFmt = format;
      }
    });
  }
}

export async function toXlsxBook(sheets: readonly ExportSheet[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    addSheet(workbook, sheet, false);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function toXlsx(table: ExportTable): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  addSheet(workbook, { name: XLSX_SHEET_NAME, table }, true);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
