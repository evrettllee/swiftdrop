import { expect, test } from '@playwright/test';
import { zonesText } from './zones';

const zone = (name: string, isActive: boolean) => ({ zoneId: 1, name, isActive });

test('should list the zones, marking the switched-off ones', () => {
  expect(zonesText([zone('Минск', true), zone('Центр', true)], false)).toBe('Минск, Центр');
  expect(zonesText([zone('Боровляны', true), zone('Заславль', false)], false)).toBe(
    'Боровляны, Заславль (выкл.)',
  );
});

test('should say there are no zones or no active ones', () => {
  expect(zonesText([], false)).toBe('Нет зон');
  expect(zonesText([zone('Заславль', false)], false)).toBe('Нет активных зон');
  expect(zonesText([], true)).toBe('Зоны: нет');
  expect(zonesText([zone('Заславль', false)], true)).toBe('Зоны: нет активных');
  expect(zonesText([zone('Минск', true)], true)).toBe('Зоны: Минск');
});
