import { DatabaseError } from 'pg';
import { PG_UNIQUE_VIOLATION_CODE } from '../common.constants';

export function getUniqueViolationConstraint(error: unknown): string | null {
  let current: unknown = error;
  let constraint: string | null = null;

  while (current instanceof Error && constraint === null) {
    if (current instanceof DatabaseError && current.code === PG_UNIQUE_VIOLATION_CODE) {
      constraint = current.constraint ?? null;
    }
    current = current.cause;
  }

  return constraint;
}
