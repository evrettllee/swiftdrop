import { MS_PER_SECOND } from '@/common/constants/time.constants';
import {
  FAILURE_MESSAGES,
  STRIPE_ID_PATTERN,
  TECHNICAL_CODE_PATTERN,
  TIMEOUT_ERROR_CODE,
  TIMEOUT_ERROR_NAME,
  UNKNOWN_FAILURE_CODE,
} from '../constants/service-failures.constants';

export type FetchFailureCode = 'timeout' | 'unavailable' | 'bad_response';

export type Failure<C extends string> = { code: C; message: string };

function fieldOf(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null && key in value
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

export function safeCode(value: unknown): string | null {
  return typeof value === 'string' &&
    TECHNICAL_CODE_PATTERN.test(value) &&
    !STRIPE_ID_PATTERN.test(value)
    ? value
    : null;
}

export function errorCodeOf(error: unknown): string {
  return (
    safeCode(fieldOf(error, 'code')) ??
    safeCode(fieldOf(fieldOf(error, 'cause'), 'code')) ??
    (fieldOf(error, 'stack') === undefined ? null : safeCode(fieldOf(error, 'name'))) ??
    UNKNOWN_FAILURE_CODE
  );
}

export function isTimeoutError(error: unknown): boolean {
  return (
    fieldOf(error, 'name') === TIMEOUT_ERROR_NAME ||
    fieldOf(error, 'code') === TIMEOUT_ERROR_CODE ||
    fieldOf(fieldOf(error, 'cause'), 'code') === TIMEOUT_ERROR_CODE
  );
}

export function timeoutMessage(timeoutMs: number): string {
  return FAILURE_MESSAGES.TIMEOUT(timeoutMs / MS_PER_SECOND);
}

export function fetchFailureOf(error: unknown, timeoutMs: number): Failure<FetchFailureCode> {
  return isTimeoutError(error)
    ? { code: 'timeout', message: timeoutMessage(timeoutMs) }
    : { code: 'unavailable', message: errorCodeOf(error) };
}

export function httpStatusFailure(status: number): Failure<FetchFailureCode> {
  return { code: 'unavailable', message: FAILURE_MESSAGES.HTTP_STATUS(status) };
}

export function badResponseFailure(message: string): Failure<FetchFailureCode> {
  return { code: 'bad_response', message };
}
