import { DatabaseError } from 'pg';
import {
  PG_LOCK_NOT_AVAILABLE_CODE,
  PG_UNIQUE_VIOLATION_CODE,
} from '../constants/database.constants';

// The Postgres error somewhere in the chain of causes (the query builder wraps the driver error).
function findDatabaseError(error: unknown, code: string): DatabaseError | null {
  let current: unknown = error;
  let found: DatabaseError | null = null;

  while (current instanceof Error && found === null) {
    if (current instanceof DatabaseError && current.code === code) {
      found = current;
    }
    current = current.cause;
  }

  return found;
}

export function getUniqueViolationConstraint(error: unknown): string | null {
  return findDatabaseError(error, PG_UNIQUE_VIOLATION_CODE)?.constraint ?? null;
}

// A statement waited for a row lock longer than lock_timeout (DB_LOCK_TIMEOUT_MS) allows.
export function isLockTimeout(error: unknown): boolean {
  return findDatabaseError(error, PG_LOCK_NOT_AVAILABLE_CODE) !== null;
}
