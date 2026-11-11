import { is, SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { Database } from '@/database/database.module';
import type { PaymentGateway } from '../contracts/payment-gateway.contract';
import { PaymentRefundService } from './payment-refund.service';

const dialect = new PgDialect({ casing: 'snake_case' });

function fakeDatabase(payment: { status: string; paymentRef: string | null } | undefined) {
  const sets: Record<string, unknown>[] = [];
  const selectChain = {
    from: () => selectChain,
    where: () => selectChain,
    limit: () => Promise.resolve(payment ? [payment] : []),
  };
  const updateChain = {
    set: (values: Record<string, unknown>) => {
      sets.push(values);

      return updateChain;
    },
    where: () => Promise.resolve(),
  };
  const db = { select: () => selectChain, update: () => updateChain } as unknown as Database;

  return { db, sets };
}

function service(db: Database) {
  const refund = jest.fn().mockResolvedValue(undefined);
  const gateway = { refund } as unknown as PaymentGateway;

  return { refunds: new PaymentRefundService(db, gateway), refund };
}

describe('PaymentRefundService', () => {
  it('should keep the time of the refund by the database clock once the money is back', async () => {
    const { db, sets } = fakeDatabase({ status: 'paid', paymentRef: 'pi_1' });
    const { refunds, refund } = service(db);

    await expect(refunds.refundPayment(5)).resolves.toBe(true);

    expect(refund).toHaveBeenCalledWith('pi_1');
    const [values] = sets;
    expect(values).toMatchObject({ status: 'refunded' });
    expect(is(values.refundedAt, SQL) && dialect.sqlToQuery(values.refundedAt).sql).toBe('now()');
  });

  it('should change nothing when the refund fails in the payment system', async () => {
    const { db, sets } = fakeDatabase({ status: 'paid', paymentRef: 'pi_1' });
    const { refunds, refund } = service(db);
    refund.mockRejectedValue(new Error('declined'));

    await expect(refunds.refundPayment(5)).rejects.toThrow('declined');

    expect(sets).toEqual([]);
  });

  it('should leave a payment that is not paid alone', async () => {
    const { db, sets } = fakeDatabase({ status: 'refunded', paymentRef: 'pi_1' });
    const { refunds, refund } = service(db);

    await expect(refunds.refundPayment(5)).resolves.toBe(false);

    expect(refund).not.toHaveBeenCalled();
    expect(sets).toEqual([]);
  });
});
