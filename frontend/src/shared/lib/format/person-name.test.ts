import { expect, test } from '@playwright/test';
import { formatShortPersonName } from './person-name';

test('should name a person by the first name and the initial of the last name', () => {
  expect(formatShortPersonName('Андрей', 'Ковалёв')).toBe('Андрей К.');
});

test('should keep only the first name when there is no last name', () => {
  expect(formatShortPersonName('Удалённый пользователь', '')).toBe('Удалённый пользователь');
});
