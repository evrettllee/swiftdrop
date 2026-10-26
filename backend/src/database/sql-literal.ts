import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

// Index and check conditions are stored in the schema as SQL text, so values go in as literals,
// not as query parameters. Only constants from the code are passed here, never user input.
export function sqlLiteral(value: string): SQL {
  return sql.raw(`'${value.replaceAll("'", "''")}'`);
}

// A number in a check: a query parameter would end up as "$1" in the migration.
export function sqlIntegerLiteral(value: number): SQL {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`Not an integer literal: ${value}`);
  }

  return sql.raw(String(value));
}

export function sqlLiteralList(values: readonly string[]): SQL {
  return sql.raw(values.map((value) => `'${value.replaceAll("'", "''")}'`).join(', '));
}
