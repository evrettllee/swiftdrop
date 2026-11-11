import { QueryBuilder } from 'drizzle-orm/pg-core';
import { DB_CASING } from '@/database/database.constants';
import {
  addressPointColumns,
  addressViewColumns,
  aliasOrderAddresses,
} from './order-address-columns';

// The SQL of a query that selects the given columns, built without a database.
function selectSql(build: (queryBuilder: QueryBuilder) => { toSQL: () => { sql: string } }) {
  return build(new QueryBuilder({ casing: DB_CASING })).toSQL().sql;
}

describe('order address columns', () => {
  const { pickup, delivery } = aliasOrderAddresses();

  it('should select the text fields of the pickup address under its own alias', () => {
    const sql = selectSql((queryBuilder) =>
      queryBuilder.select(addressViewColumns(pickup)).from(pickup),
    );

    expect(sql).toBe(
      'select "city", "street", "house", "apartment" from "addresses" "pickup_address"',
    );
  });

  it('should add the point to the text fields of the delivery address', () => {
    const sql = selectSql((queryBuilder) =>
      queryBuilder.select(addressPointColumns(delivery)).from(delivery),
    );

    expect(sql).toBe(
      'select "city", "street", "house", "apartment", "latitude", "longitude" from "addresses" "delivery_address"',
    );
  });
});
