import { expect, test } from '@playwright/test';
import { formatCount, pluralize } from './count';

const ORDERS = { one: 'заказ', few: 'заказа', many: 'заказов' };

test('should split thousands with a space', () => {
  expect(formatCount(1248).replace(/\s/u, ' ')).toBe('1 248');
  expect(formatCount(37)).toBe('37');
});

test('should pick the Russian form by the number', () => {
  expect([1, 2, 5, 11, 21, 22, 25, 111].map((count) => pluralize(count, ORDERS))).toEqual([
    'заказ',
    'заказа',
    'заказов',
    'заказов',
    'заказ',
    'заказа',
    'заказов',
    'заказов',
  ]);
});
