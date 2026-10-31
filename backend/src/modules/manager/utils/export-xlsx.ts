import ExcelJS from 'exceljs';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { wallClock, wallClockAsUtc } from '@/common/utils/wall-clock';
import {
  XLSX_DATE_FORMAT,
  XLSX_MONEY_FORMAT,
  XLSX_SHEET_NAME,
} from '../constants/manager-export.constants';
import type { ExportCell, ExportCellKind, ExportTable } from '../types/manager-export.types';

const HEADER_ROW = 1;
const FIRST_COLUMN = 1;

const NUMBER_FORMATS: Partial<Record<ExportCellKind, string>> = {
  date: XLSX_DATE_FORMAT,
  money: XLSX_MONEY_FORMAT,
};

function cellValue(cell: ExportCell): ExcelJS.CellValue {
  return cell instanceof Date ? wallClockAsUtc(wallClock(cell, APP_TIME_ZONE)) : cell;
}

export async function toXlsx({ columns, rows }: ExportTable): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(XLSX_SHEET_NAME, {
    views: [{ state: 'frozen', ySplit: HEADER_ROW }],
  });

  sheet.columns = columns.map(({ header, kind, width }) => ({
    header,
    width,
    style: NUMBER_FORMATS[kind] ? { numFmt: NUMBER_FORMATS[kind] } : {},
  }));
  sheet.getRow(HEADER_ROW).font = { bold: true };
  sheet.autoFilter = {
    from: { row: HEADER_ROW, column: FIRST_COLUMN },
    to: { row: HEADER_ROW, column: columns.length },
  };

  for (const row of rows) {
    sheet.addRow(row.map(cellValue));
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
