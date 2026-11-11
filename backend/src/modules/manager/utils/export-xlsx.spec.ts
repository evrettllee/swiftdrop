import ExcelJS from 'exceljs';
import type { ExportTable } from '../types/manager-export.types';
import { toXlsx } from './export-xlsx';

const TABLE: ExportTable = {
  columns: [
    { header: '№', kind: 'number', width: 8 },
    { header: 'Создан', kind: 'date', width: 17 },
    { header: 'Клиент', kind: 'text', width: 24 },
    { header: 'Стоимость', kind: 'money', width: 11 },
  ],
  rows: [[42, new Date('2026-10-29T21:05:00Z'), 'Иван Петров', 9.2]],
};

async function readBack(table: ExportTable) {
  const workbook = new ExcelJS.Workbook();
  const buffer = await toXlsx(table);
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  return workbook.getWorksheet('Заказы');
}

describe('toXlsx', () => {
  it('should write one sheet with a bold header, a frozen first row and a filter', async () => {
    const sheet = await readBack(TABLE);

    expect(sheet?.getRow(1).values).toEqual([undefined, '№', 'Создан', 'Клиент', 'Стоимость']);
    expect(sheet?.getRow(1).getCell(1).font?.bold).toBe(true);
    expect(sheet?.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 });
    expect(sheet?.autoFilter).toBe('A1:D1');
    expect(sheet?.getColumn(3).width).toBe(24);
  });

  it('should write the time in Minsk as a real date cell', async () => {
    const cell = (await readBack(TABLE))?.getRow(2).getCell(2);

    expect(cell?.type).toBe(ExcelJS.ValueType.Date);
    expect(cell?.numFmt).toBe('dd.mm.yyyy hh:mm');
    expect(cell?.value).toEqual(new Date('2026-10-30T00:05:00.000Z'));
  });

  it('should write the price as a number with two decimals', async () => {
    const cell = (await readBack(TABLE))?.getRow(2).getCell(4);

    expect(cell?.type).toBe(ExcelJS.ValueType.Number);
    expect(cell?.value).toBe(9.2);
    expect(cell?.numFmt).toBe('0.00');
  });

  it.each(['=HYPERLINK("x")', '+375291234567', '=1+1', '-2', '@SUM(A1)'])(
    'should write %j as plain text without an apostrophe',
    async (text) => {
      const sheet = await readBack({ columns: [TABLE.columns[2]], rows: [[text]] });
      const cell = sheet?.getRow(2).getCell(1);

      expect(cell?.type).toBe(ExcelJS.ValueType.String);
      expect(cell?.value).toBe(text);
      expect(cell?.formula).toBeUndefined();
    },
  );
});
