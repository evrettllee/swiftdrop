import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { formatWallDateTime, wallClock } from '@/common/utils/wall-clock';
import {
  CSV_BOM,
  CSV_DECIMAL_SEPARATOR,
  CSV_LINE_END,
  CSV_NEEDS_QUOTES,
  CSV_QUOTE,
  CSV_SEPARATOR,
  DECIMAL_DIGITS,
  FORMULA_GUARD,
  FORMULA_START,
  MONEY_DIGITS,
  PERCENT_SCALE,
} from '../constants/manager-export.constants';
import type { ExportCell, ExportCellKind, ExportTable } from '../types/manager-export.types';
import { cellKindOf, formatDay, plainCell } from './export-cells';

const DOUBLED_QUOTE = `${CSV_QUOTE}${CSV_QUOTE}`;
const ALL_QUOTES = new RegExp(CSV_QUOTE, 'g');

export function guardFormula(text: string): string {
  return FORMULA_START.test(text) ? `${FORMULA_GUARD}${text}` : text;
}

export function quoteCsvField(text: string): string {
  return CSV_NEEDS_QUOTES.test(text)
    ? `${CSV_QUOTE}${text.replace(ALL_QUOTES, DOUBLED_QUOTE)}${CSV_QUOTE}`
    : text;
}

function decimalText(value: number, digits: number): string {
  return value.toFixed(digits).replace('.', CSV_DECIMAL_SEPARATOR);
}

function numberText(value: number, kind: ExportCellKind): string {
  if (kind === 'money') {
    return decimalText(value, MONEY_DIGITS);
  }

  if (kind === 'decimal') {
    return decimalText(value, DECIMAL_DIGITS);
  }

  return kind === 'percent' ? String(Math.round(value * PERCENT_SCALE)) : String(value);
}

function cellText(cell: ExportCell, columnKind: ExportCellKind): string {
  const kind = cellKindOf(cell, columnKind);
  const value = plainCell(cell);

  if (value === null) {
    return '';
  }

  if (value instanceof Date) {
    return formatWallDateTime(wallClock(value, APP_TIME_ZONE));
  }

  if (typeof value === 'number') {
    return numberText(value, kind);
  }

  return guardFormula(kind === 'day' ? formatDay(value) : value);
}

export function toCsv({ columns, rows }: ExportTable): Buffer {
  const header = columns.map((column) => quoteCsvField(guardFormula(column.header)));
  const lines = rows.map((row) =>
    row.map((cell, index) => quoteCsvField(cellText(cell, columns[index].kind))),
  );
  const text = [header, ...lines].map((line) => line.join(CSV_SEPARATOR)).join(CSV_LINE_END);

  return Buffer.from(`${CSV_BOM}${text}${CSV_LINE_END}`, 'utf8');
}
