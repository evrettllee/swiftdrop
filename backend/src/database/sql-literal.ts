import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

// Index and check conditions are stored in the schema as SQL text, so values go in as literals,
// not as query parameters. Only constants from the code are passed here, never user input.
export function sqlLiteral(value: string): SQL {
  return sql.raw(`'${value.replaceAll("'", "''")}'`);
}

export function sqlLiteralList(values: readonly string[]): SQL {
  return sql.raw(values.map((value) => `'${value.replaceAll("'", "''")}'`).join(', '));
}
