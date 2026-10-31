import { drizzle } from 'drizzle-orm/node-postgres';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import { courierCandidatesQuery } from './courier-candidates-query';

const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;
const NOW = new Date('2026-10-30T12:00:00Z');
const ORDER = {
  pickup: { latitude: 53.9, longitude: 27.55 },
  parcel: { weightKg: 2.5, lengthCm: 30, widthCm: 20, heightCm: 10, isFragile: false },
};
const NO_FILTERS = { search: null, vehicleTypes: null };

function render(options: Partial<Parameters<typeof courierCandidatesQuery>[3]> = {}) {
  return courierCandidatesQuery(db, ORDER, NOW, {
    filters: NO_FILTERS,
    suitable: true,
    sort: 'pickupDistance:asc',
    limit: 50,
    ...options,
  }).toSQL();
}

describe('courierCandidatesQuery', () => {
  it('should keep the suitable couriers by the rules of the automatic assignment', () => {
    const { sql, params } = render();

    expect(sql).toContain('where ((("users"."is_blocked" = ');
    expect(sql).toContain('and (("courier_profiles"."is_available" = ');
    expect(sql).toContain('"courier_profiles"."location_updated_at" >= $');
    expect(sql).toContain('not exists (select "order_id" from "orders"');
    expect(sql).toContain('"vehicles"."vehicle_id" is not null');
    expect(sql).toContain('"vehicles"."type" in (');
    expect(sql).not.toContain('<= $');
    expect(params).toContain(new Date(NOW.getTime() - 120_000).toISOString());
  });

  it('should put the nearest first and take at most 50', () => {
    const { sql, params } = render();

    expect(sql).toMatch(
      /asc nulls last, "courier_profiles"\."courier_profile_id" asc limit \$\d+$/,
    );
    expect(params.at(-1)).toBe(50);
  });

  it('should keep the unsuitable couriers by name, at most 20', () => {
    const { sql, params } = render({ suitable: false, sort: 'name:asc', limit: 20 });

    expect(sql).toContain('and not (coalesce("courier_profiles"."is_available" = ');
    expect(sql).toMatch(
      /order by "users"\."last_name" asc, "users"\."first_name" asc, "courier_profiles"\."courier_profile_id" asc limit \$\d+$/,
    );
    expect(params.at(-1)).toBe(20);
  });

  it('should search by name or by phone and filter by vehicle', () => {
    const byName = render({
      filters: { search: { kind: 'text', pattern: '%Сок%' }, vehicleTypes: ['car', 'truck'] },
    });
    const byPhone = render({
      filters: {
        search: { kind: 'number', orderId: null, phone: '+375291234567' },
        vehicleTypes: null,
      },
    });

    expect(byName.sql).toContain(`("users"."first_name" || ' ' || "users"."last_name") ilike $`);
    expect(byName.params).toEqual(expect.arrayContaining(['%Сок%', 'car', 'truck']));
    expect(byPhone.sql).toContain('"users"."phone" = $');
    expect(byPhone.params).toContain('+375291234567');
  });

  it('should tell whether the courier has an open offer', () => {
    expect(render().sql).toContain(
      'exists (select "offer_id" from "order_offers" where ("order_offers"."courier_id" = "courier_profiles"."courier_profile_id"',
    );
  });
});
