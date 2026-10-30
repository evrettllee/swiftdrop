import type { SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import type { OfferNotifierService } from './offer-notifier.service';
import { StaleOffersService } from './stale-offers.service';

const dialect = new PgDialect({ casing: 'snake_case' });

function closingDatabase() {
  const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;
  const where = jest.fn((condition: SQL) => {
    expect(condition).toBeDefined();

    return { returning: () => Promise.resolve([]) };
  });
  const set = jest.fn(() => ({ where }));

  jest.spyOn(db, 'update').mockReturnValue({ set } as unknown as ReturnType<Database['update']>);

  return { db, set, where };
}

describe('StaleOffersService', () => {
  it('should close only pending offers, so a revoked one stays revoked and tells nobody', async () => {
    const { db, set, where } = closingDatabase();
    const withdraw = jest.fn();
    const service = new StaleOffersService(db, { withdraw } as unknown as OfferNotifierService);

    await expect(service.close(new Date('2026-10-30T12:00:00Z'))).resolves.toBe(0);

    const { sql, params } = dialect.sqlToQuery(where.mock.calls[0][0]);

    expect(sql).toMatch(/^\("order_offers"\."status" = \$1 and/);
    expect(params[0]).toBe('pending');
    expect(set).toHaveBeenCalledWith({ status: 'expired' });
    expect(withdraw).not.toHaveBeenCalled();
  });
});
