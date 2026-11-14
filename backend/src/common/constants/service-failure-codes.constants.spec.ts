import { SERVICE_NAME_VALUES } from '@/common/enums/service-name.enum';
import { SERVICE_FAILURE_FIELD_LENGTH } from './field-lengths.constants';
import { EXTERNAL_SERVICES, SERVICE_FAILURE_CODE } from './service-failure-codes.constants';

describe('service failure codes', () => {
  it('should give the agreed codes of every service', () => {
    const codes = Object.fromEntries(
      SERVICE_NAME_VALUES.map((service) => [service, Object.values(SERVICE_FAILURE_CODE[service])]),
    );

    expect(codes).toEqual({
      osrm: ['timeout', 'unavailable', 'bad_response'],
      nbrb: ['timeout', 'unavailable', 'bad_response', 'saved_rate_used'],
      mail: ['send_failed', 'timeout'],
      stripe: ['webhook_bad_signature', 'api_error', 'timeout'],
      server: ['internal_error'],
    });
  });

  it('should keep every code short, in snake case and unique within its service', () => {
    for (const service of SERVICE_NAME_VALUES) {
      const codes: string[] = Object.values(SERVICE_FAILURE_CODE[service]);

      expect(new Set(codes).size).toBe(codes.length);

      for (const code of codes) {
        expect(code).toMatch(/^[a-z]+(_[a-z]+)*$/);
        expect(code.length).toBeLessThanOrEqual(SERVICE_FAILURE_FIELD_LENGTH.CODE);
      }
    }
  });

  it('should count every service but the server as external', () => {
    expect(EXTERNAL_SERVICES).toEqual(['osrm', 'nbrb', 'mail', 'stripe']);
  });
});
