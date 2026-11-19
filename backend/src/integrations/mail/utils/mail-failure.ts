import type { ServiceFailureCode } from '@/common/constants/service-failure-codes.constants';
import {
  TIMEOUT_ERROR_CODE,
  UNKNOWN_FAILURE_CODE,
} from '@/modules/service-failures/constants/service-failures.constants';
import { type Failure, safeCode } from '@/modules/service-failures/utils/failure-message';
import { mailFailureCodeOf } from './mail-failure-code';

export function mailFailureOf(error: unknown): Failure<ServiceFailureCode<'mail'>> {
  const code = safeCode(mailFailureCodeOf(error)) ?? UNKNOWN_FAILURE_CODE;

  return { code: code === TIMEOUT_ERROR_CODE ? 'timeout' : 'send_failed', message: code };
}
