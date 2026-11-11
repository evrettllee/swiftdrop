import { DatabaseError } from 'pg';
import {
  PG_LOCK_NOT_AVAILABLE_CODE,
  PG_UNIQUE_VIOLATION_CODE,
} from '@/common/constants/database.constants';
import { getUniqueViolationConstraint, isLockTimeout } from './pg-errors';

const CONSTRAINT = 'payments_one_pending_per_order_uidx';

function databaseError(code: string, constraint?: string): DatabaseError {
  const error = new DatabaseError('database error', 0, 'error');
  error.code = code;
  error.constraint = constraint;

  return error;
}

// The query builder wraps the driver error, as drizzle does with "Failed query".
function wrapped(cause: Error): Error {
  return new Error('Failed query', { cause });
}

describe('pg errors', () => {
  it('should find a lock timeout when it is the error itself or its cause', () => {
    const lockTimeout = databaseError(PG_LOCK_NOT_AVAILABLE_CODE);

    expect(isLockTimeout(lockTimeout)).toBe(true);
    expect(isLockTimeout(wrapped(lockTimeout))).toBe(true);
  });

  it('should not take another error for a lock timeout', () => {
    expect(isLockTimeout(wrapped(databaseError(PG_UNIQUE_VIOLATION_CODE)))).toBe(false);
    expect(isLockTimeout(new Error('network'))).toBe(false);
    expect(isLockTimeout('not an error')).toBe(false);
  });

  it('should return the constraint of a unique violation found in the causes', () => {
    expect(
      getUniqueViolationConstraint(wrapped(databaseError(PG_UNIQUE_VIOLATION_CODE, CONSTRAINT))),
    ).toBe(CONSTRAINT);
    expect(getUniqueViolationConstraint(databaseError(PG_LOCK_NOT_AVAILABLE_CODE))).toBeNull();
  });
});
