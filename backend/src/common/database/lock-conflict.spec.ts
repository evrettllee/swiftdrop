import { ConflictException } from '@nestjs/common';
import { DatabaseError } from 'pg';
import {
  PG_LOCK_NOT_AVAILABLE_CODE,
  PG_UNIQUE_VIOLATION_CODE,
} from '@/common/constants/database.constants';
import { withLockConflict } from './lock-conflict';

const BUSY_MESSAGE = 'busy';
const RESULT = 42;

function failedQuery(code: string): Error {
  const cause = new DatabaseError('database error', 0, 'error');
  cause.code = code;

  return new Error('Failed query', { cause });
}

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

  it('should pass any other error through unchanged', async () => {
    const error = failedQuery(PG_UNIQUE_VIOLATION_CODE);
    const onBusy = jest.fn();

    await expect(withLockConflict(() => Promise.reject(error), BUSY_MESSAGE, onBusy)).rejects.toBe(
      error,
    );
    expect(onBusy).not.toHaveBeenCalled();
  });
});
