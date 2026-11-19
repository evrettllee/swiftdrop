import type { AnalyticsSummary } from '@/modules/manager/types/manager-analytics.types';
import { couriersSheet } from './couriers-sheet';
import { managerDaysSheet, managerHoursSheet } from './manager-day-sheets';
import { managerSummarySheet } from './manager-summary-sheet';
import { zonesSheet } from './zones-sheet';

const headers = (sheet: { table: { columns: { header: string }[] } }) =>
  sheet.table.columns.map((column) => column.header);

const ZONE = {
  zoneId: 1,
  name: 'Центр',
  orders: 10,
  onTime: 4,
  onTimeTotal: 5,
  averageDeliveryMinutes: 31.5,
  manualAssigned: 2,
  revenue: 120.5,
};

describe('analytics export sheets', () => {
  it('should build the zones table with shares as fractions and keep the order of the rows', () => {
    const sheet = zonesSheet([ZONE, { ...ZONE, zoneId: null, name: 'Без зоны', onTimeTotal: 0 }]);

    expect(sheet.name).toBe('По зонам');
    expect(headers(sheet)).toEqual([
      'Зона',
      'Заказов',
      'Вовремя %',
      'Среднее время мин',
      'Вручную назначено',
      'Выручка BYN',
    ]);
    expect(sheet.table.rows).toEqual([
      ['Центр', 10, 0.8, 31.5, 2, 120.5],
      ['Без зоны', 10, null, 31.5, 2, 120.5],
    ]);
  });

  it('should name a courier by the first name and the initial only', () => {
    const sheet = couriersSheet([
      {
        courierId: 3,
        firstName: 'Дмитрий',
        lastName: 'Соколов',
        vehicleType: 'car',
        delivered: 12,
        onTimePct: 87.5,
        avgDeliveryMin: 28.4,
        declinedOffers: 3,
        hoursOnline: 6.5,
      },
    ]);

    expect(headers(sheet)).toEqual([
      'Курьер',
      'Транспорт',
      'Доставок',
      'Вовремя %',
      'Среднее время мин',
      'Отказы от предложений',
      'Часов на линии',
    ]);
    expect(sheet.table.rows).toEqual([['Дмитрий С.', 'Легковой', 12, 0.875, 28.4, 3, 6.5]]);
  });

  it('should build the manager days and hours tables', () => {
    const days = managerDaysSheet([
      { date: '2026-10-01', delivered: 3, cancelled: 1, inProgress: 0 },
    ]);
    const hours = managerHoursSheet([{ hour: 9, avgOrders: 1.25 }]);

    expect([days.name, headers(days), days.table.rows]).toEqual([
      'По дням',
      ['Дата', 'Доставлены', 'Отменены', 'В работе'],
      [['2026-10-01', 3, 1, 0]],
    ]);
    expect([hours.name, headers(hours), hours.table.rows]).toEqual([
      'По часам',
      ['Час', 'Заказов в час'],
      [['9:00', 1.25]],
    ]);
  });

  it('should start the manager summary with the period and give every KPI with the previous', () => {
    const kpi = <T>(current: T, previous: T) => ({ current, previous });
    const summary = {
      period: {
        from: '2026-10-01',
        to: '2026-10-07',
        previousFrom: '2026-09-24',
        previousTo: '2026-09-30',
      },
      kpis: {
        delivered: kpi({ delivered: 8, total: 10 }, { delivered: 5, total: 6 }),
        onTime: kpi({ pct: 75, count: 6 }, { pct: null, count: 0 }),
        avgDeliveryMin: kpi(32.5, null),
        cancelled: kpi(
          { pct: 20, count: 2, by: { client: 1, system: 1, staff: 0 } },
          { pct: 0, count: 0, by: { client: 0, system: 0, staff: 0 } },
        ),
        revenue: kpi(
          { total: '80.00', avgCheck: '10.00', orders: 8 },
          { total: '0', avgCheck: null, orders: 0 },
        ),
        courierSearch: kpi({ avgMin: 1.5, manual: 2 }, { avgMin: null, manual: 0 }),
      },
      days: [],
      hours: [],
      zones: [],
    } satisfies AnalyticsSummary;
    const sheet = managerSummarySheet(summary);

    expect(headers(sheet)).toEqual(['Показатель', 'Значение', 'Предыдущий период']);
    expect(sheet.table.rows.slice(0, 2)).toEqual([
      ['Период', '01.10.2026 – 07.10.2026', null],
      ['Сравнение с', '24.09.2026 – 30.09.2026', null],
    ]);
    expect(sheet.table.rows.map((row) => row[0])).toEqual([
      'Период',
      'Сравнение с',
      'Доставлено',
      'Оформлено заказов',
      'Вовремя',
      'Среднее время доставки, мин',
      'Отменено',
      'Отменено заказов',
      'Отменено клиентом',
      'Отменено системой',
      'Отменено сотрудником',
      'Выручка, BYN',
      'Средний чек, BYN',
      'Поиск курьера, мин',
      'Назначено вручную',
    ]);
    expect(sheet.table.rows[4]).toEqual([
      'Вовремя',
      { value: 0.75, kind: 'percent' },
      { value: null, kind: 'percent' },
    ]);
    expect(sheet.table.rows[11]).toEqual([
      'Выручка, BYN',
      { value: 80, kind: 'money' },
      { value: 0, kind: 'money' },
    ]);
  });
});
