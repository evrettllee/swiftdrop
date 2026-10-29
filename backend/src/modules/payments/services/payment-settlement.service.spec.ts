import { is, SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { Database } from '@/database/database.module';
import { PaymentSettlementService } from './payment-settlement.service';

const dialect = new PgDialect({ casing: 'snake_case' });

function fakeDatabase(returned: unknown[]) {
  const sets: Record<string, unknown>[] = [];
  const chain = {
    set: (values: Record<string, unknown>) => {
      sets.push(values);

      return chain;
    },
    where: () => chain,
    returning: () => Promise.resolve(returned),
  };
  const db = { update: () => chain } as unknown as Database;

  return { db, sets };
}

describe('PaymentSettlementService', () => {
  it('should keep the time of the payment by the database clock when it turns paid', async () => {
    const { db, sets } = fakeDatabase([{ orderId: 42 }]);

    await expect(new PaymentSettlementService(db).markPaid('cs_1', 'pi_1')).resolves.toEqual({
      orderId: 42,
    });

    const [values] = sets;
    expect(values).toMatchObject({ status: 'paid', stripePaymentId: 'pi_1' });
    expect(is(values.paidAt, SQL) && dialect.sqlToQuery(values.paidAt).sql).toBe('now()');
  });

  it('should report nothing for a payment already settled', async () => {
    const { db } = fakeDatabase([]);

    await expect(
      new PaymentSettlementService(db).markPaid('cs_1', 'pi_1'),
    ).resolves.toBeUndefined();
  });
});
