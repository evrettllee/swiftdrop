import { ConflictException } from '@nestjs/common';
import { isDeadlock, isLockTimeout } from './pg-errors';

export function isLockConflict(error: unknown): boolean {
  return isLockTimeout(error) || isDeadlock(error);
}

// Runs work that waits for row locks. A lock not taken within lock_timeout becomes 409 with the
// message, after onBusy (for a log line); any other error passes through unchanged.
export async function withLockConflict<T>(
  work: () => Promise<T>,
  message: string,
  onBusy?: () => void,
): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (isLockConflict(error)) {
      onBusy?.();
      throw new ConflictException(message);
    }

    throw error;
  }
}
