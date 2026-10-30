import { drizzle } from 'drizzle-orm/node-postgres';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import { couriersMapQueries } from './couriers-map-query';

const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;
const NO_FILTERS = { states: null, vehicleTypes: null, search: null };
const STATE_ORDER =
  /when "courier_profiles"\."location_updated_at" is null or .+ > \$\d+\s+then 'no_signal'\s+when "orders"\."order_id" is not null then 'on_order'\s+when \(\(select .+\)\) is not null then 'offer'\s+else 'free'/s;

function render(filters: Partial<typeof NO_FILTERS> | object = {}) {
  const queries = couriersMapQueries(db, { ...NO_FILTERS, ...filters });

  return { items: queries.items.toSQL(), counts: queries.counts.toSQL() };
}

describe('couriersMapQueries', () => {
  it('should decide the state by no signal, then an order, then an offer, else free', () => {
    const { items } = render();

    expect(items.sql).toMatch(STATE_ORDER);
    expect(items.params).toContain(60_000);
  });

  it('should keep only active accounts on shift or with an active order', () => {
    const { sql } = render().items;

    expect(sql).toContain('"users"."is_blocked" = $');
    expect(sql).toContain('"users"."deleted_at" is null');
    expect(sql).toContain('("courier_profiles"."is_available" = $');
    expect(sql).toContain('or "orders"."order_id" is not null)');
    expect(sql).toContain(
      'left join "orders" on ("orders"."courier_id" = "courier_profiles"."courier_profile_id"',
    );
  });

  it('should sort by name with the id last and take at most 500', () => {
    const { sql, params } = render().items;

    expect(sql).toMatch(
      /order by "courier_map"\."last_name" asc, "courier_map"\."first_name" asc, "courier_map"\."courier_profile_id" asc limit \$\d+$/,
    );
    expect(params.at(-1)).toBe(500);
  });

  it('should filter the items by state and count every state by the other filters only', () => {
    const { items, counts } = render({
      states: ['free', 'offer'],
      vehicleTypes: ['car'],
      search: { kind: 'text', pattern: '%Сок%' },
    });

    expect(items.sql).toContain('"courier_map" where "state" in ($');
    expect(items.params).toEqual(expect.arrayContaining(['free', 'offer', 'car', '%Сок%']));
    expect(counts.sql).toMatch(/group by "state"$/);
    expect(counts.sql).not.toContain('"state" in');
    expect(counts.params).toEqual(expect.arrayContaining(['car', '%Сок%']));
  });
});
