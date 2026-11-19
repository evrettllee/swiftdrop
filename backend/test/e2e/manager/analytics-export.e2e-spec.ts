import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { CSV_BOM } from '@/modules/manager/constants/manager-export.constants';
import { ANALYTICS_PERIOD as PERIOD } from '@test/support/admin-analytics-plans';
import { getAnalytics } from '@test/support/analytics';
import {
  allText,
  type ExportSessions,
  getAnalyticsExport,
  PERSONAL_VALUES,
  readWorkbook,
  seedExportAnalytics,
  sheetRows,
} from '@test/support/analytics-export';
import { createTestApp } from '@test/support/app';
import { TEST_ZONE_NAME } from '@test/support/constants';
import { csvLines } from '@test/support/manager';

const ZONE_ROWS = [
  [TEST_ZONE_NAME, 2, 0.5, 65, 1, 20],
  ['Восток', 1, 1, 60, 0, 10],
  ['Без зоны', 1, undefined, 30, 0, 10],
];

describe('Manager analytics export (e2e)', () => {
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
    return getAnalyticsExport(app, sessions.manager, 'manager', { ...PERIOD, ...query }).expect(
      HttpStatus.OK,
    );
  }

  it('should give the zones in the manager summary with the admin shape', async () => {
    const { body } = await getAnalytics(app, sessions.manager, 'summary', PERIOD).expect(
      HttpStatus.OK,
    );

    expect(Object.keys(body)).toEqual(['period', 'kpis', 'days', 'hours', 'zones']);
    expect(body.zones.map((zone: { name: string }) => zone.name)).toEqual([
      TEST_ZONE_NAME,
      'Восток',
      'Без зоны',
    ]);
    expect(body.zones[2]).toEqual({
      zoneId: null,
      name: 'Без зоны',
      orders: 1,
      onTime: 0,
      onTimeTotal: 0,
      averageDeliveryMinutes: 30,
      manualAssigned: 0,
      revenue: 10,
    });
  });

  it('should give every manager section in the window order with the file name', async () => {
    const response = await download({
      format: 'xlsx',
      sections: 'couriers,zones,hours,days,summary',
    });
    const book = await readWorkbook(response.body as Buffer);
    const name = 'swiftdrop-manager-analytics-2026-10-01_2026-10-07.xlsx';

    expect(response.headers['content-disposition']).toBe(
      `attachment; filename="${name}"; filename*=UTF-8''${name}`,
    );
    expect(book.worksheets.map((sheet) => sheet.name)).toEqual([
      'Сводка',
      'По дням',
      'По часам',
      'По зонам',
      'Курьеры',
    ]);
    expect(sheetRows(book.getWorksheet('Сводка')).slice(0, 3)).toEqual([
      ['Показатель', 'Значение', 'Предыдущий период'],
      ['Период', '01.10.2026 – 07.10.2026'],
      ['Сравнение с', '24.09.2026 – 30.09.2026'],
    ]);
    expect(sheetRows(book.getWorksheet('По дням'))).toHaveLength(8);
    expect(sheetRows(book.getWorksheet('По часам'))).toHaveLength(25);
    expect(sheetRows(book.getWorksheet('По зонам')).slice(1)).toEqual(ZONE_ROWS);
    expect(sheetRows(book.getWorksheet('Курьеры'))[1][0]).toBe('Дмитрий С.');
    for (const value of PERSONAL_VALUES) {
      expect(allText(book)).not.toContain(value);
    }
  });

  it.each([
    ['days', 'Дата;Доставлены;Отменены;В работе', 8],
    ['hours', 'Час;Заказов в час', 25],
    ['zones', 'Зона;Заказов;Вовремя %;Среднее время мин;Вручную назначено;Выручка BYN', 4],
    ['couriers', 'Курьер;Транспорт;Доставок;Вовремя %', 2],
  ])('should give the %s table as csv with a BOM', async (section, header, lines) => {
    const response = await download({ format: 'csv', sections: section });
    const body = response.body as Buffer;
    const rows = csvLines(body);

    expect(body.toString('utf8').startsWith(CSV_BOM)).toBe(true);
    expect(response.headers['content-disposition']).toContain(
      'swiftdrop-manager-analytics-2026-10-01_2026-10-07.csv',
    );
    expect(rows[0].join(';')).toContain(header);
    expect(rows).toHaveLength(lines);
    expect(body.toString('utf8')).not.toContain('Соколов');
  });
});
