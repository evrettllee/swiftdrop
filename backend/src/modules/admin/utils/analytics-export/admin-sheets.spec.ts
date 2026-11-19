import { adminDaysSheet } from './admin-days-sheet';
import { failuresSheet } from './failures-sheet';

const headers = (sheet: { table: { columns: { header: string }[] } }) =>
  sheet.table.columns.map((column) => column.header);

describe('admin analytics export sheets', () => {
  it('should give every column of the days table in the agreed order', () => {
    const sheet = adminDaysSheet([
      {
        date: '2026-10-01',
        ordersCreated: 4,
        delivered: 2,
        revenue: 15,
        onTime: 1,
        onTimeTotal: 2,
        newClients: 3,
        tickets: 1,
        serverErrors: 0,
      },
    ]);

    expect(sheet.name).toBe('По дням');
    expect(headers(sheet)).toEqual([
      'Дата',
      'Заказов оформлено',
      'Доставлено',
      'Выручка BYN',
      'Доставлено вовремя %',
      'Новые клиенты',
      'Обращений',
      'Ошибки сервера',
    ]);
    expect(sheet.table.rows).toEqual([['2026-10-01', 4, 2, 15, 0.5, 3, 1, 0]]);
  });

  it('should give the failures with Russian service names and texts', () => {
    const sheet = failuresSheet([
      {
        firstAt: '2026-10-02T09:00:00.000Z',
        lastAt: '2026-10-02T09:05:00.000Z',
        service: 'nbrb',
        code: 'saved_rate_used',
        message: 'Курс от 01.10.2026',
        repeats: 3,
      },
    ]);

    expect(sheet.name).toBe('Сбои');
    expect(headers(sheet)).toEqual([
      'Первый раз',
      'Последний раз',
      'Сервис',
      'Что случилось',
      'Сообщение',
      'Повторов',
    ]);
    expect(sheet.table.rows).toEqual([
      [
        new Date('2026-10-02T09:00:00.000Z'),
        new Date('2026-10-02T09:05:00.000Z'),
        'Курс НБ РБ',
        'Оплата по сохранённому курсу',
        'Курс от 01.10.2026',
        3,
      ],
    ]);
  });
});
