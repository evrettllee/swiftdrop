import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { CSV_BOM } from '@/modules/manager/constants/manager-export.constants';
import { ANALYTICS_PERIOD as PERIOD } from '@test/support/admin-analytics-plans';
import {
  allText,
  type ExportSessions,
  FORMULA_MESSAGE,
  getAnalyticsExport,
  PERSONAL_VALUES,
  readWorkbook,
  seedExportAnalytics,
  sheetRows,
} from '@test/support/analytics-export';
import { createTestApp } from '@test/support/app';
import { TEST_ZONE_NAME } from '@test/support/constants';
import { csvLines } from '@test/support/manager';

const ALL = 'failures,couriers,zones,days,summary';

describe('Admin analytics export (e2e)', () => {
  let app: NestExpressApplication;
  let sessions: ExportSessions;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    sessions = await seedExportAnalytics(app, app.get<Database>(DRIZZLE), getRoute);
  });

  afterAll(async () => {
    await app.close();
  });

  function download(query: Record<string, string>) {
    return getAnalyticsExport(app, sessions.admin, 'admin', { ...PERIOD, ...query }).expect(
      HttpStatus.OK,
    );
  }

  it('should give every section as a sheet in the window order with the file name', async () => {
    const response = await download({ format: 'xlsx', sections: ALL });
    const book = await readWorkbook(response.body as Buffer);
    const name = 'swiftdrop-analytics-2026-10-01_2026-10-07.xlsx';

    expect(response.headers['content-disposition']).toBe(
      `attachment; filename="${name}"; filename*=UTF-8''${name}`,
    );
    expect(book.worksheets.map((sheet) => sheet.name)).toEqual([
      'Сводка',
      'По дням',
      'По зонам',
      'Курьеры',
      'Сбои',
    ]);
    expect(book.getWorksheet('По дням')?.getRow(1).getCell(1).font?.bold).toBe(true);
    expect(sheetRows(book.getWorksheet('Сводка')).slice(0, 3)).toEqual([
      ['Раздел', 'Показатель', 'Значение', 'Предыдущий период'],
      [undefined, 'Период', '01.10.2026 – 07.10.2026'],
      [undefined, 'Сравнение с', '24.09.2026 – 30.09.2026'],
    ]);
    for (const value of PERSONAL_VALUES) {
      expect(allText(book)).not.toContain(value);
    }
  });

  it('should fill the sheets from the same numbers as the screen', async () => {
    const book = await readWorkbook(
      (await download({ format: 'xlsx', sections: ALL })).body as Buffer,
    );
    const summary = new Map(sheetRows(book.getWorksheet('Сводка')).map((row) => [row[1], row]));
    const days = sheetRows(book.getWorksheet('По дням'));

    expect(summary.get('Доставлено вовремя')?.slice(2)).toEqual([2 / 3, 0]);
    expect(summary.get('Ошибки сервера')?.slice(2)).toEqual([2, 0]);
    expect(summary.get('Курьеров на линии')?.slice(3)).toEqual([]);
    expect(days).toHaveLength(8);
    expect(days[1][0]).toEqual(new Date('2026-10-01T00:00:00.000Z'));
    expect(days.map((row) => row[4])).toEqual([
      'Доставлено вовремя %',
      1,
      0,
      undefined,
      1,
      undefined,
      undefined,
      undefined,
    ]);
    expect(sheetRows(book.getWorksheet('По зонам')).slice(1)).toEqual([
      [TEST_ZONE_NAME, 2, 0.5, 65, 1, 20],
      ['Восток', 1, 1, 60, 0, 10],
      ['Без зоны', 1, undefined, 30, 0, 10],
    ]);
    expect(sheetRows(book.getWorksheet('Курьеры'))[1][0]).toBe('Дмитрий С.');
    expect(sheetRows(book.getWorksheet('Сбои')).slice(1)).toEqual([
      [
        new Date('2026-10-05T12:00:00.000Z'),
        new Date('2026-10-05T12:00:00.000Z'),
        'Курс НБ РБ',
        'Оплата по сохранённому курсу',
        FORMULA_MESSAGE,
        1,
      ],
      [
        new Date('2026-10-03T12:00:00.000Z'),
        new Date('2026-10-03T12:00:00.000Z'),
        'Сервер',
        'Внутренняя ошибка сервера',
        'Connection timed out',
        2,
      ],
    ]);
  });

  it('should keep the window order when the query lists the sections the other way', async () => {
    const book = await readWorkbook(
      (await download({ format: 'xlsx', sections: 'failures,summary' })).body as Buffer,
    );

    expect(book.worksheets.map((sheet) => sheet.name)).toEqual(['Сводка', 'Сбои']);
  });

  it.each([
    ['days', 'Дата;Заказов оформлено;Доставлено;Выручка BYN;Доставлено вовремя %', 8],
    ['zones', 'Зона;Заказов;Вовремя %;Среднее время мин;Вручную назначено;Выручка BYN', 4],
    ['couriers', 'Курьер;Транспорт;Доставок;Вовремя %;Среднее время мин', 2],
    ['failures', 'Первый раз;Последний раз;Сервис;Что случилось;Сообщение;Повторов', 3],
  ])('should give the %s table as csv with a BOM', async (section, header, lines) => {
    const response = await download({ format: 'csv', sections: section });
    const body = response.body as Buffer;
    const rows = csvLines(body);

    expect(body.toString('utf8').startsWith(CSV_BOM)).toBe(true);
    expect(response.headers['content-disposition']).toContain('2026-10-01_2026-10-07.csv');
    expect(rows.map((row) => row.join(';'))[0]).toContain(header);
    expect(rows).toHaveLength(lines);
  });

  it('should escape a cell that starts like a formula in csv', async () => {
    const rows = csvLines((await download({ format: 'csv', sections: 'failures' })).body as Buffer);

    expect(rows[1][4]).toBe(`"'${FORMULA_MESSAGE.replaceAll('"', '""')}"`);
    expect(rows[1][0]).toBe('05.10.2026 12:00');
  });
});
