import { drizzle } from 'drizzle-orm/node-postgres';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import { courierLookupQuery } from './courier-lookup-query';

const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;

function render(query: Partial<Parameters<typeof courierLookupQuery>[1]> = {}) {
  return courierLookupQuery(db, { search: null, limit: 10, ...query }).toSQL();
}

describe('courierLookupQuery', () => {
  it('should leave out deleted accounts and keep blocked ones', () => {
    const { sql } = render();

    expect(sql).toContain('"users"."deleted_at" is null');
    expect(sql).not.toContain('is_blocked');
    expect(sql).not.toContain('is_available');
  });

  it('should sort by name with the id last and take the limit', () => {
    const { sql, params } = render({ limit: 7 });

    expect(sql).toMatch(
      /order by "users"\."last_name" asc, "users"\."first_name" asc, "courier_profiles"\."courier_profile_id" asc limit \$\d+$/,
    );
    expect(params.at(-1)).toBe(7);
  });

  it('should find by the full name for a text search', () => {
    const { sql, params } = render({ search: { kind: 'text', pattern: '%Сок%' } });

    expect(sql).toContain(' ilike $');
    expect(params).toContain('%Сок%');
  });

  it('should find by the phone for a number search and nothing without a phone', () => {
    const byPhone = render({ search: { kind: 'number', orderId: 1, phone: '+375331112233' } });
    const noPhone = render({ search: { kind: 'number', orderId: 12, phone: null } });

    expect(byPhone.sql).toContain('"users"."phone" = $');
    expect(byPhone.params).toContain('+375331112233');
    expect(noPhone.sql).toContain('false');
  });

  it('should take the vehicle type without requiring a vehicle', () => {
    const { sql } = render();

    expect(sql).toContain('left join "vehicles"');
    expect(sql).toContain('"vehicles"."type"');
  });
});
