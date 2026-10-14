import { HttpStatus } from '@nestjs/common';
import { MS_PER_MINUTE } from '../../../common/constants/time.constants';
import {
  DELIVERIES_ERROR_MESSAGES,
  DELIVERY_CODE_LOCK_MINUTES,
  HANDOVER_OUTCOME,
} from '../constants/deliveries.constants';
import { handoverError } from './handover-error';

const NOW = new Date('2026-10-14T12:00:00Z');
const ATTEMPTS_LEFT = 3;
// A lock that ends a moment before the full lock time still shows the full minutes.
const MOMENT_MS = 1;

describe('handoverError', () => {
  it('should return no error when the order is delivered', () => {
    expect(handoverError({ kind: HANDOVER_OUTCOME.DELIVERED }, NOW)).toBeNull();
  });

  it.each([
    [HANDOVER_OUTCOME.NOT_FOUND, HttpStatus.NOT_FOUND, DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND],
    [HANDOVER_OUTCOME.WRONG_STEP, HttpStatus.CONFLICT, DELIVERIES_ERROR_MESSAGES.WRONG_STEP],
  ] as const)('should answer for %s with its status and text', (kind, status, message) => {
    const error = handoverError({ kind }, NOW);

    expect(error?.getStatus()).toBe(status);
    expect(error?.message).toBe(message);
  });

  it('should answer 422 with the attempts left when the code is wrong', () => {
    const error = handoverError(
      { kind: HANDOVER_OUTCOME.WRONG_CODE, attemptsLeft: ATTEMPTS_LEFT },
      NOW,
    );

    expect(error?.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(error?.message).toBe(DELIVERIES_ERROR_MESSAGES.WRONG_CODE(ATTEMPTS_LEFT));
  });

  it('should answer 429 with the whole minutes left when the entering is locked', () => {
    const lockedUntil = new Date(
      NOW.getTime() + DELIVERY_CODE_LOCK_MINUTES * MS_PER_MINUTE - MOMENT_MS,
    );
    const error = handoverError({ kind: HANDOVER_OUTCOME.LOCKED, lockedUntil }, NOW);

    expect(error?.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(error?.message).toBe(DELIVERIES_ERROR_MESSAGES.CODE_LOCKED(DELIVERY_CODE_LOCK_MINUTES));
  });
});
