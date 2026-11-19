import { SERVICE_NAME_VALUES } from '@/common/enums/service-name.enum';
import { SERVICE_FAILURE_CODE } from './service-failure-codes.constants';
import {
  failureText,
  SERVICE_FAILURE_TEXTS,
  SERVICE_LABELS,
} from './service-failure-texts.constants';

describe('service failure texts', () => {
  it('should name every service in Russian', () => {
    expect(SERVICE_LABELS).toEqual({
      osrm: 'Маршруты (OSRM)',
      nbrb: 'Курс НБ РБ',
      mail: 'Почта',
      stripe: 'Оплата (Stripe)',
      server: 'Сервер',
    });
  });

  it('should give a Russian text to every code of every service and to nothing else', () => {
    for (const service of SERVICE_NAME_VALUES) {
      const codes = Object.values(SERVICE_FAILURE_CODE[service]).sort();
      const texts: Record<string, string> = SERVICE_FAILURE_TEXTS[service];

      expect(Object.keys(texts).sort()).toEqual(codes);

      for (const text of Object.values(texts)) {
        expect(text).toMatch(/[а-яё]/);
        expect(text.length).toBeLessThanOrEqual(80);
      }
    }
  });

  it('should keep an unknown stored code readable', () => {
    expect(failureText('osrm', 'timeout')).toBe(SERVICE_FAILURE_TEXTS.osrm.timeout);
    expect(failureText('osrm', 'ETIMEDOUT')).toBe('ETIMEDOUT');
  });
});
