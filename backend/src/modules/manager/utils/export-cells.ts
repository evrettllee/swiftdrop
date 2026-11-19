import type { ExportCell, ExportCellKind, ExportTypedCell } from '../types/manager-export.types';

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isTypedCell(cell: ExportCell): cell is ExportTypedCell {
  return typeof cell === 'object' && cell !== null && !(cell instanceof Date);
}

export function cellKindOf(cell: ExportCell, columnKind: ExportCellKind): ExportCellKind {
  return isTypedCell(cell) ? cell.kind : columnKind;
}

export function plainCell(cell: ExportCell): string | number | Date | null {
  return isTypedCell(cell) ? cell.value : cell;
}

export function formatDay(day: string): string {
  const match = DAY_PATTERN.exec(day);

  return match === null ? day : `${match[3]}.${match[2]}.${match[1]}`;
}

export function dayAsDate(day: string): Date | string {
  return DAY_PATTERN.test(day) ? new Date(`${day}T00:00:00.000Z`) : day;
}
