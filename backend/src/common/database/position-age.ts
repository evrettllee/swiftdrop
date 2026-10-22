import { type AnyColumn, type SQL, sql } from 'drizzle-orm';
import { MS_PER_SECOND } from '../constants/time.constants';

// How old a stored position is, in milliseconds, by the clock of the database that stored it; null
// when there is no position.
export function positionAgeMsSql(updatedAt: AnyColumn): SQL<number | null> {
  return sql<number | null>`(extract(epoch from now() - ${updatedAt}) * ${MS_PER_SECOND})::float8`;
}
