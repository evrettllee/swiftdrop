import { expect, test } from '@playwright/test';
import { readListParams, writeListParams } from '@/shared/lib/list-params';
import { MANAGER_SEARCH_MAX_LENGTH } from '@/shared/staff-api';
import { MAP_FILTER } from './map';
import { MAP_PARAMS_CONFIG } from './map-params';

test('should read valid single state, multiple vehicles in order, and trimmed search from URL', () => {
  const params = new URLSearchParams(
    'state=free&vehicleType=car,foot,car&q=%20%D0%95%D0%B3%D0%BE%D1%80%20',
  );

  expect(readListParams(params, MAP_PARAMS_CONFIG)).toEqual({
    state: MAP_FILTER.FREE,
    vehicleType: ['foot', 'car'],
    q: 'Егор',
  });
});

test('should fall back to defaults for invalid state, vehicleType, or overlong search', () => {
  const tooLong = 'а'.repeat(MANAGER_SEARCH_MAX_LENGTH + 1);
  const params = new URLSearchParams(`state=offer&vehicleType=car,plane&q=${tooLong}`);

  expect(readListParams(params, MAP_PARAMS_CONFIG)).toEqual(MAP_PARAMS_CONFIG.defaults);
});

test('should preserve other filters and selected courier when updating or clearing one filter', () => {
  const base = new URLSearchParams('state=on_order&vehicleType=foot%2Ccar&q=Лиса&courier=7');
  const current = readListParams(base, MAP_PARAMS_CONFIG);

  expect(
    writeListParams(base, { ...current, vehicleType: ['car'] }, MAP_PARAMS_CONFIG).toString(),
  ).toBe('courier=7&state=on_order&vehicleType=car&q=%D0%9B%D0%B8%D1%81%D0%B0');
  expect(writeListParams(base, { ...current, vehicleType: [] }, MAP_PARAMS_CONFIG).toString()).toBe(
    'courier=7&state=on_order&q=%D0%9B%D0%B8%D1%81%D0%B0',
  );
  expect(writeListParams(base, { ...current, state: null }, MAP_PARAMS_CONFIG).toString()).toBe(
    'courier=7&vehicleType=foot%2Ccar&q=%D0%9B%D0%B8%D1%81%D0%B0',
  );
});
