import type { ManagerExportRow } from '../types/manager-export.types';
import { contentDisposition, exportHeaders } from './export-headers';
import { buildExportTable } from './export-table';

const CREATED = new Date('2026-10-29T21:05:00Z');
const ROW: ManagerExportRow = {
  orderId: 42,
  createdAt: CREATED,
  status: 'courier_assigned',
  client: { firstName: 'Иван', lastName: 'Петров', phone: '+375291234567' },
  pickup: { street: 'ул. Свердлова', house: '13а' },
  delivery: { street: 'пр-т Притыцкого', house: '83' },
  courier: { firstName: 'Дмитрий', lastName: 'Соколов', phone: '+375331112233' },
  price: '9.23',
  paymentState: 'paid',
  finishedAt: null,
};
const FILE = 'swiftdrop-orders-2026-10-30.csv';

describe('buildExportTable', () => {
  it('should give the columns of the table without phones', () => {
    const table = buildExportTable([ROW], false);

    expect(table.columns.map((column) => column.header)).toEqual([
      '№',
      'Создан',
      'Статус',
      'Клиент',
      'Откуда',
      'Куда',
      'Курьер',
      'Стоимость',
      'Оплата',
      'Завершён',
    ]);
    expect(table.rows).toEqual([
      [
        42,
        CREATED,
        'Курьер назначен',
        'Иван Петров',
        'ул. Свердлова, 13а',
        'пр-т Притыцкого, 83',
        'Дмитрий Соколов',
        9.23,
        'Оплачен',
        null,
      ],
    ]);
    expect(JSON.stringify(table)).not.toContain('+375');
  });

  it('should put the phones after the client and after the courier', () => {
    const table = buildExportTable([{ ...ROW, courier: null }], true);

    expect(table.columns.map((column) => column.header)).toEqual([
      '№',
      'Создан',
      'Статус',
      'Клиент',
      'Телефон клиента',
      'Откуда',
      'Куда',
      'Курьер',
      'Телефон курьера',
      'Стоимость',
      'Оплата',
      'Завершён',
    ]);
    expect(table.rows[0].slice(3, 9)).toEqual([
      'Иван Петров',
      '+375291234567',
      'ул. Свердлова, 13а',
      'пр-т Притыцкого, 83',
      null,
      null,
    ]);
  });
});

describe('exportHeaders', () => {
  it('should send the file as an attachment that is never stored or sniffed', () => {
    const headers = exportHeaders({
      filename: FILE,
      contentType: 'text/csv; charset=utf-8',
      body: Buffer.alloc(0),
    });

    expect(headers).toEqual({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${FILE}"; filename*=UTF-8''${FILE}`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
  });

  it('should encode the name by RFC 5987', () => {
    expect(contentDisposition('заказы.csv')).toContain("filename*=UTF-8''%D0%B7");
  });
});
