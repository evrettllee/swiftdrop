import { SERVICE_FAILURE_CODE } from '@/common/constants/service-failure-codes.constants';
import { SERVICE_NAME_VALUES } from '@/common/enums/service-name.enum';
import type { PerfSeedStep } from './perf-seed-people.sql';

export const PERF_FAILURES = 20000;

const CODES = SERVICE_NAME_VALUES.flatMap((service) =>
  Object.values(SERVICE_FAILURE_CODE[service]).map((code) => `('${service}', '${code}')`),
);

const FAILURES = `INSERT INTO service_failures (service, code, message, first_at, last_at, repeats)
SELECT codes.service::service_name, codes.code, 'Perf failure ' || codes.code,
  now() - f * interval '7 minutes' - (f % 9) * interval '1 minute', now() - f * interval '7 minutes',
  1 + f % 7
FROM generate_series(1, ${PERF_FAILURES}) f
JOIN (SELECT row_number() OVER () - 1 AS slot, service, code
  FROM (VALUES ${CODES.join(', ')}) AS listed(service, code)) codes
  ON codes.slot = f % ${CODES.length}`;

export const PERF_SEED_FAILURES: readonly PerfSeedStep[] = [['service failures', FAILURES]];
