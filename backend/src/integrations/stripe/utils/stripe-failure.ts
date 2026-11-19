import { HttpStatus } from '@nestjs/common';
import Stripe from 'stripe';
import type { ServiceFailureCode } from '@/common/constants/service-failure-codes.constants';
import {
  errorCodeOf,
  type Failure,
  isTimeoutError,
  safeCode,
} from '@/modules/service-failures/utils/failure-message';

type StripeApiFailureCode = Exclude<ServiceFailureCode<'stripe'>, 'webhook_bad_signature'>;

export function stripeFailureOf(error: unknown): Failure<StripeApiFailureCode> {
  if (!(error instanceof Stripe.errors.StripeError)) {
    return { code: 'api_error', message: errorCodeOf(error) };
  }

  const timedOut =
    error instanceof Stripe.errors.StripeConnectionError && isTimeoutError(error.detail);
  const parts = [safeCode(error.rawType ?? error.type), safeCode(error.code)];

  return {
    code: timedOut ? 'timeout' : 'api_error',
    message: parts.filter((part) => part !== null).join(' '),
  };
}

export function isNotOpenSessionError(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.statusCode === HttpStatus.BAD_REQUEST
  );
}
