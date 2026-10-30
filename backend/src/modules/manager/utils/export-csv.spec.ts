import { CSV_BOM } from '../constants/manager-export.constants';
import type { ExportTable } from '../types/manager-export.types';
import { guardFormula, toCsv } from './export-csv';

const TABLE: ExportTable = {
  columns: [
    { header: '№', kind: 'number', width: 8 },
    { header: 'Создан', kind: 'date', width: 17 },
    { header: 'Клиент', kind: 'text', width: 24 },
    { header: 'Стоимость', kind: 'money', width: 11 },
    { header: 'Завершён', kind: 'date', width: 17 },
  ],
  rows: [
    [42, new Date('2026-10-29T21:05:00Z'), 'Иван "Ваня"; Петров', 9.2, null],
    [
      43,
      new Date('2026-01-01T00:00:00Z'),
      'строка\r\nвторая',
      10,
      new Date('2026-01-01T10:30:00Z'),
    ],
  ],
};

function decode(buffer: Buffer): string {
  return buffer.toString('utf8');
}

describe('toCsv', () => {
  it('should start with a BOM and end every line with CRLF', () => {
    const text = decode(toCsv(TABLE));

    expect(text.startsWith(`${CSV_BOM}№;Создан;Клиент;Стоимость;Завершён\r\n`)).toBe(true);
    expect(text.endsWith('\r\n')).toBe(true);
  });

  it('should quote by RFC 4180 and keep line breaks inside a quoted cell', () => {
    const lines = decode(toCsv(TABLE)).slice(CSV_BOM.length).split('\r\n');

    expect(lines[1]).toBe('42;30.10.2026 00:05;"Иван ""Ваня""; Петров";9,20;');
    expect(lines[2]).toBe('43;01.01.2026 03:00;"строка');
    expect(lines[3]).toBe('вторая";10,00;01.01.2026 13:30');
  });

  it.each(['=1+1', '+375291234567', '-2', '@SUM(A1)', '\tcmd', '\rcmd'])(
    'should put an apostrophe before a cell that starts like a formula: %j',
    (text) => {
      const csv = decode(toCsv({ columns: [TABLE.columns[2]], rows: [[text]] }));
      const cell = csv.slice(CSV_BOM.length).split('\r\n').slice(1, -1).join('\r\n');

      expect(cell.replace(/^"/, '').startsWith(`'${text}`)).toBe(true);
    },
  );

  it('should leave ordinary text alone', () => {
    expect(guardFormula('ул. Свердлова, 13а')).toBe('ул. Свердлова, 13а');
  });
});
