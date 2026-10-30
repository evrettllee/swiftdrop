import { type SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { OrderTransactionsService } from '@/modules/tracking/services/order-transactions.service';
import { queueDatabase } from '@test/support/queue-database';
import type { CourierCandidatesService } from './courier-candidates.service';
import type { DispatchOrdersService } from './dispatch-orders.service';
import type { OfferNotifierService } from './offer-notifier.service';
import type { OfferRoutesService } from './offer-routes.service';
import { OrderDispatchService } from './order-dispatch.service';
import type { OrderOffersService } from './order-offers.service';

const dialect = new PgDialect({ casing: 'snake_case' });
const ORDER = {
  orderId: 42,
  pickup: { latitude: 53.9, longitude: 27.55 },
  delivery: { latitude: 53.91, longitude: 27.6 },
  parcel: { weightKg: 2.5, lengthCm: 30, widthCm: 20, heightCm: 10, isFragile: false },
};

function setUp(offersCounted: number) {
  const fake = queueDatabase([[{ total: offersCounted }], [{ confirmedAt: new Date() }]]);
  const findNearest = jest.fn().mockResolvedValue([]);
  const run = jest.fn();
  const service = new OrderDispatchService(
    fake.db,
    { load: jest.fn().mockResolvedValue(ORDER) } as unknown as DispatchOrdersService,
    { findNearest } as unknown as CourierCandidatesService,
    {} as OfferRoutesService,
    {} as OrderOffersService,
    {} as OfferNotifierService,
    { run } as unknown as OrderTransactionsService,
  );

  return { service, fake, findNearest, run };
}

describe('OrderDispatchService', () => {
  it('should not count offers revoked by a manager as attempts of the order', async () => {
    const { service, fake } = setUp(0);

    await service.dispatch(42, new Date());

    const countWhere = fake.calls.find((call) => call.method === 'where')?.args[0] as SQL;
    const { sql, params } = dialect.sqlToQuery(countWhere);

    expect(sql).toBe('("order_offers"."order_id" = $1 and "order_offers"."status" <> $2)');
    expect(params).toEqual([42, 'revoked']);
  });

  it('should keep searching while fewer than five offers count', async () => {
    const { service, findNearest, run } = setUp(4);

    await service.dispatch(42, new Date());

    expect(findNearest).toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it('should hand the order to a manager after five counted offers', async () => {
    const { service, findNearest, run } = setUp(5);
    run.mockResolvedValue(undefined);

    await service.dispatch(42, new Date());

    expect(findNearest).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledTimes(1);
  });
});
