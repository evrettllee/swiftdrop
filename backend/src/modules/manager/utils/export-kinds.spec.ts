import ExcelJS from 'exceljs';
import type { ExportSheet, ExportTable } from '../types/manager-export.types';
import { toCsv } from './export-csv';
import { toXlsxBook } from './export-xlsx';

const TABLE: ExportTable = {
  columns: [
    { header: 'Дата', kind: 'day', width: 12 },
    { header: 'Вовремя %', kind: 'percent', width: 12 },
    { header: 'Среднее время мин', kind: 'decimal', width: 14 },
    { header: 'Значение', kind: 'text', width: 14 },
  ],
  rows: [
    ['2026-10-01', 0.857, 31.25, { value: 0.5, kind: 'percent' }],
    ['2026-10-02', null, null, { value: 12.5, kind: 'money' }],
  ],
};

async function readBook(sheets: ExportSheet[]) {
  const workbook = new ExcelJS.Workbook();
  const buffer = await toXlsxBook(sheets);
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  return workbook;
}

describe('export cell kinds', () => {
  it('should write the sheets in the given order with bold frozen headers', async () => {
    const book = await readBook([
      { name: 'Сводка', table: TABLE },
      { name: 'По дням', table: TABLE },
    ]);

    expect(book.worksheets.map((sheet) => sheet.name)).toEqual(['Сводка', 'По дням']);
    expect(book.getWorksheet('По дням')?.getRow(1).getCell(1).font?.bold).toBe(true);
    expect(book.getWorksheet('По дням')?.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 });
    expect(book.getWorksheet('По дням')?.getColumn(3).width).toBe(14);
  });

  it('should write a day as a date, a share as a percent and minutes with one decimal', async () => {
    const row = (await readBook([{ name: 'По дням', table: TABLE }]))
      .getWorksheet('По дням')
      ?.getRow(2);

    expect(row?.getCell(1).value).toEqual(new Date('2026-10-01T00:00:00.000Z'));
    expect(row?.getCell(1).numFmt).toBe('dd.mm.yyyy');
    expect([row?.getCell(2).value, row?.getCell(2).numFmt]).toEqual([0.857, '0%']);
    expect([row?.getCell(3).value, row?.getCell(3).numFmt]).toEqual([31.25, '0.0']);
    expect([row?.getCell(4).value, row?.getCell(4).numFmt]).toEqual([0.5, '0%']);
  });

  it('should give a cell its own kind in a mixed column', async () => {
    const cell = (await readBook([{ name: 'Сводка', table: TABLE }]))
      .getWorksheet('Сводка')
      ?.getRow(3)
      .getCell(4);

    expect([cell?.value, cell?.numFmt]).toEqual([12.5, '0.00']);
  });

  it('should write the same kinds as text in csv', () => {
    const lines = toCsv(TABLE).toString('utf8').replace('﻿', '').split('\r\n');

    expect(lines.slice(1, 3)).toEqual(['01.10.2026;86;31,3;50', '02.10.2026;;;12,50']);
  });
});
