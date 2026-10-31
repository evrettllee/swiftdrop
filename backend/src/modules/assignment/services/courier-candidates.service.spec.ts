import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import { CourierCandidatesService } from './courier-candidates.service';

const ORDER = {
  orderId: 42,
  pickup: { latitude: 53.9, longitude: 27.55 },
  delivery: { latitude: 53.91, longitude: 27.6 },
  parcel: { weightKg: 2.5, lengthCm: 30, widthCm: 20, heightCm: 10, isFragile: false },
  round: 2,
};
const OFFERED_IN_ROUND =
  /"order_offers"\."order_id" = \$(\d+) and "order_offers"\."round" = \$(\d+)\)\)/;

function recordingDatabase() {
  const queries: { text: string; values: unknown[] }[] = [];
  const client = {
    query: (query: { text: string }, values: unknown[]) => {
      queries.push({ text: query.text, values });

      return Promise.resolve({ rows: [], fields: [] });
    },
  };
  const db = drizzle({ client: client as unknown as Pool, schema, casing: 'snake_case' });

  return { db: db as unknown as Database, queries };
}

describe('CourierCandidatesService', () => {
  it('should skip only the couriers who already had the order in the current round', async () => {
    const { db, queries } = recordingDatabase();

    await new CourierCandidatesService(db).findNearest(ORDER, new Date('2026-10-30T12:00:00Z'));

    const [{ text, values }] = queries;
    const [, orderParam, roundParam] = OFFERED_IN_ROUND.exec(text) ?? [];

    expect(text).toContain('not exists (select "offer_id" from "order_offers" where');
    expect(values[Number(orderParam) - 1]).toBe(42);
    expect(values[Number(roundParam) - 1]).toBe(2);
  });
});
