import {
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import { DELIVERIES_ERROR_MESSAGES, HANDOVER_OUTCOME } from '../constants/deliveries.constants';
import type { HandoverOutcome } from '../types/deliveries.types';

// The error the courier gets for the outcome of a code check, or null when the order is delivered.
export function handoverError(outcome: HandoverOutcome, now: Date): HttpException | null {
  let error: HttpException | null = null;

  switch (outcome.kind) {
    case HANDOVER_OUTCOME.NOT_FOUND:
      error = new NotFoundException(DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND);
      break;
    case HANDOVER_OUTCOME.WRONG_STEP:
      error = new ConflictException(DELIVERIES_ERROR_MESSAGES.WRONG_STEP);
      break;
    case HANDOVER_OUTCOME.LOCKED: {
      const minutesLeft = Math.ceil(
        (outcome.lockedUntil.getTime() - now.getTime()) / MS_PER_MINUTE,
      );
      error = new HttpException(
        DELIVERIES_ERROR_MESSAGES.CODE_LOCKED(minutesLeft),
        HttpStatus.TOO_MANY_REQUESTS,
      );
      break;
    }
    case HANDOVER_OUTCOME.WRONG_CODE:
      error = new UnprocessableEntityException(
        DELIVERIES_ERROR_MESSAGES.WRONG_CODE(outcome.attemptsLeft),
      );
      break;
    case HANDOVER_OUTCOME.DELIVERED:
      break;
  }

  return error;
}
