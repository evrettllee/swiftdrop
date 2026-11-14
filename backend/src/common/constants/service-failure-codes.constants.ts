import { SERVICE_NAME, type ServiceName } from '@/common/enums/service-name.enum';

export const SERVICE_FAILURE_CODE = {
  [SERVICE_NAME.OSRM]: {
    TIMEOUT: 'timeout',
    UNAVAILABLE: 'unavailable',
    BAD_RESPONSE: 'bad_response',
  },
  [SERVICE_NAME.NBRB]: {
    TIMEOUT: 'timeout',
    UNAVAILABLE: 'unavailable',
    BAD_RESPONSE: 'bad_response',
    SAVED_RATE_USED: 'saved_rate_used',
  },
  [SERVICE_NAME.MAIL]: { SEND_FAILED: 'send_failed', TIMEOUT: 'timeout' },
  [SERVICE_NAME.STRIPE]: {
    WEBHOOK_BAD_SIGNATURE: 'webhook_bad_signature',
    API_ERROR: 'api_error',
    TIMEOUT: 'timeout',
  },
  [SERVICE_NAME.SERVER]: { INTERNAL_ERROR: 'internal_error' },
} as const satisfies Record<ServiceName, Record<string, string>>;

type FailureCodes = typeof SERVICE_FAILURE_CODE;

export type ServiceFailureCode<S extends ServiceName> = FailureCodes[S][keyof FailureCodes[S]] &
  string;

export const EXTERNAL_SERVICES = [
  SERVICE_NAME.OSRM,
  SERVICE_NAME.NBRB,
  SERVICE_NAME.MAIL,
  SERVICE_NAME.STRIPE,
] as const satisfies readonly ServiceName[];

export type ExternalService = (typeof EXTERNAL_SERVICES)[number];
