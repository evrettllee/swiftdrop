import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import ExcelJS from 'exceljs';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { registerUser, validRegistration } from '@test/support/auth';
import {
  createManager,
  csvLines,
  getManagerExport,
  getManagerOrders,
  idsOf,
  type ManagerListBody,
} from '@test/support/manager';
import { placeOrders, SECOND_CLIENT, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

const BASE_HEADER = ['№', 'Создан', 'Статус', 'Клиент', 'Откуда', 'Куда', 'Курьер'];

describe('Manager orders export content (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let ids: number[];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const first = await registerUser(app);
    const second = await registerUser(app, SECOND_CLIENT);
    ids = [
      ...(await placeOrders(app, first.cookies, 3)),
      ...(await placeOrders(app, second.cookies, 2)),
    ];
    await setOrderStatus(db, ids[1], ORDER_STATUS.DELIVERED);
    await setOrderStatus(db, ids[3], ORDER_STATUS.CANCELLED);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function exportCsv(query: Record<string, string>): Promise<string[][]> {
    const response = await getManagerExport(app, manager, { format: 'csv', ...query }).expect(
      HttpStatus.OK,
    );

    return csvLines(response.body as Buffer);
  }

  async function exportSheet(query: Record<string, string>) {
    const response = await getManagerExport(app, manager, { format: 'xlsx', ...query }).expect(
      HttpStatus.OK,
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.body as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    return workbook.getWorksheet('Заказы');
  }

  it('should filter and sort the rows exactly as the list does', async () => {
    const query = { status: 'awaiting_payment,finished', sort: 'createdAt:asc' };
    const list = (await getManagerOrders(app, manager, query).expect(HttpStatus.OK))
      .body as ManagerListBody;

    const [header, ...rows] = await exportCsv(query);

    expect(header).toEqual([...BASE_HEADER, 'Стоимость', 'Оплата', 'Завершён']);
    expect(rows.map((row) => Number(row[0]))).toEqual(idsOf(list));
    expect(rows.find((row) => Number(row[0]) === ids[1])?.[2]).toBe('Доставлен');
    expect(rows[0][7]).toBe('9,23');
    expect(rows[0][1]).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
  });

  it('should add the phones of the client and the courier on request', async () => {
    const [header, row] = await exportCsv({ withPhones: 'true', q: String(ids[0]) });

    expect(header).toEqual([
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
    expect(row[4]).toBe(`'${validRegistration.phone}`);
    expect(row[8]).toBe('');
  });

  it('should leave the phones out by default', async () => {
    const lines = await exportCsv({});

    expect(lines.flat().some((cell) => cell.includes('+375'))).toBe(false);
  });

  it('should write the same rows into the xlsx sheet', async () => {
    const sheet = await exportSheet({ sort: 'price:asc' });

    expect(sheet?.rowCount).toBe(6);
    expect(sheet?.getRow(2).getCell(2).type).toBe(ExcelJS.ValueType.Date);
    expect(sheet?.getRow(2).getCell(8).value).toBe(9.23);
  });

  it('should write the phone into the xlsx sheet as it is, without an apostrophe', async () => {
    const sheet = await exportSheet({ withPhones: 'true', q: String(ids[0]) });
    const cell = sheet?.getRow(2).getCell(5);

    expect(cell?.type).toBe(ExcelJS.ValueType.String);
    expect(cell?.value).toBe(validRegistration.phone);
  });
});
