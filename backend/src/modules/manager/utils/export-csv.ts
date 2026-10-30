import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { formatWallDateTime, wallClock } from '@/common/utils/wall-clock';
import {
  CSV_BOM,
  CSV_DECIMAL_SEPARATOR,
  CSV_LINE_END,
  CSV_NEEDS_QUOTES,
  CSV_QUOTE,
  CSV_SEPARATOR,
  FORMULA_GUARD,
  FORMULA_START,
  MONEY_DIGITS,
} from '../constants/manager-export.constants';
import type { ExportCell, ExportCellKind, ExportTable } from '../types/manager-export.types';

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

function cellText(cell: ExportCell, kind: ExportCellKind): string {
  if (cell === null) {
    return '';
  }

  if (cell instanceof Date) {
    return formatWallDateTime(wallClock(cell, APP_TIME_ZONE));
  }

  if (typeof cell === 'number') {
    return kind === 'money'
      ? cell.toFixed(MONEY_DIGITS).replace('.', CSV_DECIMAL_SEPARATOR)
      : String(cell);
  }

  return guardFormula(cell);
}

export function toCsv({ columns, rows }: ExportTable): Buffer {
  const header = columns.map((column) => quoteCsvField(guardFormula(column.header)));
  const lines = rows.map((row) =>
    row.map((cell, index) => quoteCsvField(cellText(cell, columns[index].kind))),
  );
  const text = [header, ...lines].map((line) => line.join(CSV_SEPARATOR)).join(CSV_LINE_END);

  return Buffer.from(`${CSV_BOM}${text}${CSV_LINE_END}`, 'utf8');
}
