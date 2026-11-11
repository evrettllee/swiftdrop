import { ConflictException } from '@nestjs/common';
import { DatabaseError } from 'pg';
import {
  PG_DEADLOCK_DETECTED_CODE,
  PG_LOCK_NOT_AVAILABLE_CODE,
  PG_UNIQUE_VIOLATION_CODE,
} from '@/common/constants/database.constants';
import { isLockConflict, withLockConflict } from './lock-conflict';

const BUSY_MESSAGE = 'busy';
const RESULT = 42;

function failedQuery(code: string): Error {
  const cause = new DatabaseError('database error', 0, 'error');
  cause.code = code;

  return new Error('Failed query', { cause });
}

describe('isLockConflict', () => {
  it('should take a lock timeout and a deadlock for a lock conflict and nothing else', () => {
    expect(isLockConflict(failedQuery(PG_LOCK_NOT_AVAILABLE_CODE))).toBe(true);
    expect(isLockConflict(failedQuery(PG_DEADLOCK_DETECTED_CODE))).toBe(true);
    expect(isLockConflict(failedQuery(PG_UNIQUE_VIOLATION_CODE))).toBe(false);
    expect(isLockConflict(new Error('network'))).toBe(false);
  });
});

describe('withLockConflict', () => {
  it('should return the result when the work succeeds', async () => {
    await expect(withLockConflict(() => Promise.resolve(RESULT), BUSY_MESSAGE)).resolves.toBe(
      RESULT,
    );
  });

  it('should answer 409 and call onBusy when a lock is not taken in time', async () => {
    const onBusy = jest.fn();
    const work = () => Promise.reject(failedQuery(PG_LOCK_NOT_AVAILABLE_CODE));

    await expect(withLockConflict(work, BUSY_MESSAGE, onBusy)).rejects.toThrow(
      new ConflictException(BUSY_MESSAGE),
    );
    expect(onBusy).toHaveBeenCalledTimes(1);
  });

  it('should answer a deadlock with the same 409 as a lock timeout', async () => {
    const onBusy = jest.fn();
    const work = () => Promise.reject(failedQuery(PG_DEADLOCK_DETECTED_CODE));

    await expect(withLockConflict(work, BUSY_MESSAGE, onBusy)).rejects.toThrow(
      new ConflictException(BUSY_MESSAGE),
    );
    expect(onBusy).toHaveBeenCalledTimes(1);
  });

  it('should pass any other error through unchanged', async () => {
    const error = failedQuery(PG_UNIQUE_VIOLATION_CODE);
    const onBusy = jest.fn();

    await expect(withLockConflict(() => Promise.reject(error), BUSY_MESSAGE, onBusy)).rejects.toBe(
      error,
    );
    expect(onBusy).not.toHaveBeenCalled();
  });
});
