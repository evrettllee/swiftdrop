import { ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DatabaseError } from 'pg';
import {
  PG_DEADLOCK_DETECTED_CODE,
  PG_LOCK_NOT_AVAILABLE_CODE,
  PG_UNIQUE_VIOLATION_CODE,
} from '@/common/constants/database.constants';
import type { Database } from '@/database/database.module';
import type { NbrbService } from '@/integrations/nbrb/services/nbrb.service';
import { PAYMENTS_ERROR_MESSAGES } from '../constants/payments.constants';
import type { PaymentGateway } from '../contracts/payment-gateway.contract';
import type { PaymentAttemptsService } from './payment-attempts.service';
import { PaymentsService } from './payments.service';

function failedQuery(code: string): Error {
  const cause = Object.assign(new DatabaseError('database error', 0, 'error'), { code });

  return new Error('Failed query', { cause });
}

function setUp(error: Error) {
  const locked = {
    from: () => locked,
    where: () => locked,
    limit: () => locked,
    for: () => Promise.reject(error),
  };
  const tx = { select: () => locked };
  const db = {
    transaction: (work: (transaction: typeof tx) => Promise<unknown>) => work(tx),
  } as unknown as Database;
  const gateway = { createCheckoutSession: jest.fn() };
  const attempts = { closePending: jest.fn(), save: jest.fn() };
  const service = new PaymentsService(
    db,
    gateway as unknown as PaymentGateway,
    {} as NbrbService,
    {} as ConfigService,
    attempts as unknown as PaymentAttemptsService,
  );

  return { service, gateway, attempts };
}

describe('PaymentsService.start', () => {
  it.each([PG_LOCK_NOT_AVAILABLE_CODE, PG_DEADLOCK_DETECTED_CODE])(
    'should answer that a payment is already started on a lock conflict %s',
    async (code) => {
      const { service, gateway, attempts } = setUp(failedQuery(code));

      await expect(service.start(5, 7)).rejects.toThrow(
        new ConflictException(PAYMENTS_ERROR_MESSAGES.PAYMENT_ALREADY_STARTED),
      );
      expect(attempts.closePending).not.toHaveBeenCalled();
      expect(gateway.createCheckoutSession).not.toHaveBeenCalled();
    },
  );

  it('should pass any other failure through', async () => {
    const error = failedQuery(PG_UNIQUE_VIOLATION_CODE);
    const { service } = setUp(error);

    await expect(service.start(5, 7)).rejects.toBe(error);
  });
});
