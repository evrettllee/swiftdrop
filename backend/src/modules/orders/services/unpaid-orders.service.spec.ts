import { Logger } from '@nestjs/common';
import { DatabaseError } from 'pg';
import {
  PG_DEADLOCK_DETECTED_CODE,
  PG_LOCK_NOT_AVAILABLE_CODE,
  PG_UNIQUE_VIOLATION_CODE,
} from '@/common/constants/database.constants';
import type { Database } from '@/database/database.module';
import type { PaymentCancellationService } from '@/modules/payments/services/payment-cancellation.service';
import type { OrderTransactionsService } from '@/modules/tracking/services/order-transactions.service';
import { UnpaidOrdersService } from './unpaid-orders.service';

function failedQuery(code: string): Error {
  const cause = Object.assign(new DatabaseError('database error', 0, 'error'), { code });

  return new Error('Failed query', { cause });
}

function setUp(error: Error) {
  const expired = {
    from: () => expired,
    where: () => expired,
    orderBy: () => expired,
    limit: () => Promise.resolve([{ orderId: 7 }]),
  };
  const db = { select: () => expired } as unknown as Database;
  const run = jest.fn(() => Promise.reject(error));
  const service = new UnpaidOrdersService(
    db,
    {} as PaymentCancellationService,
    { run } as unknown as OrderTransactionsService,
  );
  const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

  return { service, warn, logError };
}

describe('UnpaidOrdersService.cancelExpired', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([PG_LOCK_NOT_AVAILABLE_CODE, PG_DEADLOCK_DETECTED_CODE])(
    'should leave a busy order for the next run on a lock conflict %s',
    async (code) => {
      const { service, warn, logError } = setUp(failedQuery(code));

      await expect(service.cancelExpired()).resolves.toBe(0);
      expect(warn).toHaveBeenCalledWith('Order 7 is busy, it is left for the next run');
      expect(logError).not.toHaveBeenCalled();
    },
  );

  it('should log any other failure as an error and go on', async () => {
    const { service, warn, logError } = setUp(failedQuery(PG_UNIQUE_VIOLATION_CODE));

    await expect(service.cancelExpired()).resolves.toBe(0);
    expect(warn).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledTimes(1);
  });
});
