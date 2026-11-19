import type { AdminSummaryInput } from '@/modules/admin/types/admin-analytics-export.types';
import { adminSummarySheet } from './admin-summary-sheet';

const PERIOD = { from: '2026-10-01', to: '2026-10-07' };
const pair = <T>(value: T, previous: T) => ({ value, previous });

const INPUT: AdminSummaryInput = {
  period: { ...PERIOD, previousFrom: '2026-09-24', previousTo: '2026-09-30' },
  business: {
    period: PERIOD,
    kpis: {
      ordersCreated: pair(10, 2),
      revenue: pair(35.5, 30),
      averageCheck: pair(11.83, null),
      refunds: pair({ amount: 15, orders: 1 }, { amount: 0, orders: 0 }),
    },
    funnel: { created: 10, paid: 7, courierAssigned: 4, delivered: 3 },
    losses: {
      unpaidExpired: 1,
      cancelledBeforePayment: 1,
      cancelledAfterPayment: { client: 1, system: 1, staff: 1 },
      inProgress: 2,
    },
    revenueByDay: [],
  },
  delivery: {
    period: PERIOD,
    kpis: {
      onTimeRate: pair({ onTime: 3, total: 4 }, { onTime: 0, total: 0 }),
      averageDeliveryMinutes: pair(41.5, null),
      autoAssignedRate: pair({ auto: 3, manual: 1 }, { auto: 0, manual: 0 }),
      averageSearchSeconds: pair(95, null),
    },
    onTimeByDay: [],
    offers: {
      accepted: 1,
      declined: 1,
      expired: 0,
      total: 2,
      orders: 1,
      maxDeclinesBeforeManual: 3,
    },
    zones: [],
  },
  users: {
    period: PERIOD,
    kpis: {
      newClients: pair(5, 1),
      activeClients: pair(4, 2),
      repeatClients: pair({ repeat: 3, active: 4 }, { repeat: 1, active: 2 }),
      couriersOnline: { onShift: 1, total: 2 },
      averageDeliveriesPerCourier: pair(2, 1),
    },
    newClientsByDay: [],
    ordersPerClient: { one: 1, two: 1, threeToFive: 1, sixPlus: 1 },
  },
  support: {
    period: PERIOD,
    kpis: {
      ticketsCreated: pair(6, 2),
      firstResponseMedianMinutes: pair(15, 30),
      closed: pair({ closed: 3, total: 6 }, { closed: 2, total: 2 }),
      unansweredNow: { count: 2, longestWaitMinutes: 5940 },
    },
    topics: [],
    firstResponseByDay: [],
  },
  service: {
    period: PERIOD,
    kpis: {
      serverErrors: pair(5, 4),
      externalFailures: pair({ failures: 13, services: 3 }, { failures: 2, services: 1 }),
      mailFailures: { count: 4, lastAt: '2026-10-06T09:00:00.000Z' },
      savedRateUsed: 6,
    },
    serverErrorsByDay: [],
    services: [],
    recent: [],
  },
};

describe('adminSummarySheet', () => {
  it('should start with the period and give every KPI of the five tabs in order', () => {
    const { name, table } = adminSummarySheet(INPUT);

    expect(name).toBe('Сводка');
    expect(table.columns.map((column) => column.header)).toEqual([
      'Раздел',
      'Показатель',
      'Значение',
      'Предыдущий период',
    ]);
    expect(table.rows.slice(0, 2)).toEqual([
      [null, 'Период', '01.10.2026 – 07.10.2026', null],
      [null, 'Сравнение с', '24.09.2026 – 30.09.2026', null],
    ]);
    expect(table.rows.slice(2).map((row) => row[1])).toEqual([
      'Заказов оформлено',
      'Выручка, BYN',
      'Средний чек, BYN',
      'Возвраты, BYN',
      'Доставлено вовремя',
      'Среднее время доставки, мин',
      'Назначено автоматически',
      'Поиск курьера, с',
      'Новые клиенты',
      'Активные клиенты',
      'Повторные клиенты',
      'Курьеров на линии',
      'Обращений',
      'Первый ответ, мин',
      'Без ответа сейчас',
      'Закрыто',
      'Ошибки сервера',
      'Сбои внешних сервисов',
      'Неотправленные письма',
      'Оплата по сохранённому курсу',
    ]);
  });

  it('should give shares as fractions and leave the previous cell empty when there is none', () => {
    const rows = adminSummarySheet(INPUT).table.rows;
    const byLabel = new Map(rows.map((row) => [row[1], row]));

    expect(byLabel.get('Доставлено вовремя')).toEqual([
      'Доставка',
      'Доставлено вовремя',
      { value: 0.75, kind: 'percent' },
      { value: null, kind: 'percent' },
    ]);
    expect(byLabel.get('Курьеров на линии')).toEqual([
      'Пользователи',
      'Курьеров на линии',
      { value: 1, kind: 'number' },
      null,
    ]);
    expect(byLabel.get('Возвраты, BYN')?.slice(2)).toEqual([
      { value: 15, kind: 'money' },
      { value: 0, kind: 'money' },
    ]);
  });
});
