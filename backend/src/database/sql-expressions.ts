import { type SQL, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export function fullNameSql(firstName: AnyPgColumn, lastName: AnyPgColumn): SQL<string> {
  return sql<string>`(${firstName} || ' ' || ${lastName})`;
}
