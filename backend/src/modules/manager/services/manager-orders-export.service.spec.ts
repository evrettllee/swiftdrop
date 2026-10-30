import { UnprocessableEntityException } from '@nestjs/common';
import type { Database } from '@/database/database.module';
import { CSV_BOM } from '../constants/manager-export.constants';
import { managerOrdersExportSchema } from '../dto/manager-orders-export.dto';
import { ManagerExportLimits } from './manager-export-limits';
import { ManagerOrdersExportService } from './manager-orders-export.service';

const NOW = new Date('2026-10-29T21:30:00Z');

function fakeDatabase(total: number) {
  const chain = {
    from: () => chain,
    innerJoin: () => chain,
    leftJoin: () => chain,
    where: () =>
      Object.assign(Promise.resolve([{ total }]), { orderBy: () => Promise.resolve([]) }),
  };

  return { select: () => chain } as unknown as Database;
}

function query(extra: Record<string, string> = {}) {
  return managerOrdersExportSchema.parse({ format: 'csv', ...extra });
}

describe('ManagerOrdersExportService', () => {
  const limits = new ManagerExportLimits();

  it('should limit the export to 5000 rows', () => {
    expect(limits.rowLimit).toBe(5000);
  });

  it('should refuse 5001 rows with EXPORT_TOO_LARGE and the total', async () => {
    const service = new ManagerOrdersExportService(fakeDatabase(5001), limits);
    const error: unknown = await service.export(query()).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect((error as UnprocessableEntityException).getResponse()).toMatchObject({
      statusCode: 422,
      code: 'EXPORT_TOO_LARGE',
      total: 5001,
    });
  });

  it('should export 5000 rows and name the file by the date in Minsk', async () => {
    const service = new ManagerOrdersExportService(fakeDatabase(5000), limits);

    const file = await service.export(query({ format: 'xlsx' }), NOW);

    expect(file.filename).toBe('swiftdrop-orders-2026-10-30.xlsx');
    expect(file.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('should write a CSV with the header alone when nothing matches', async () => {
    const service = new ManagerOrdersExportService(fakeDatabase(0), limits);

    const file = await service.export(query(), NOW);

    expect(file.body.toString('utf8')).toBe(
      `${CSV_BOM}№;Создан;Статус;Клиент;Откуда;Куда;Курьер;Стоимость;Оплата;Завершён\r\n`,
    );
  });
});
