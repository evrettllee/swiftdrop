import { expect, test } from '@playwright/test';
import { formatPrice, parsePrice } from './number-input';

test('should read a comma and a dot as the same decimal separator', () => {
  expect(parsePrice('0,9', 100)).toEqual({ value: 0.9 });
  expect(parsePrice('0.9', 100)).toEqual({ value: 0.9 });
  expect(parsePrice(' 12,50 ', 1000)).toEqual({ value: 12.5 });
  expect(parsePrice('7', 1000)).toEqual({ value: 7 });
  expect(parsePrice(',5', 100)).toEqual({ value: 0.5 });
  expect(parsePrice('2.', 100)).toEqual({ value: 2 });
});

test('should show a value with two digits and a comma', () => {
  expect(formatPrice(0.7)).toBe('0,70');
  expect(formatPrice(12)).toBe('12,00');
  expect(formatPrice(2.5)).toBe('2,50');
  expect(formatPrice(1000)).toBe('1000,00');
});

test('should ask for a number when there is none', () => {
  for (const raw of ['', '   ', 'abc', '1,2,3', '1e3', '--1', '1 000']) {
    expect(parsePrice(raw, 100)).toEqual({ message: 'Введите число' });
  }
});

test('should ask for more than zero for zero and below', () => {
  for (const raw of ['0', '0,00', '-1', '-0,5']) {
    expect(parsePrice(raw, 100)).toEqual({ message: 'Больше 0' });
  }
});

test('should refuse more than two digits after the comma', () => {
  expect(parsePrice('0,123', 100)).toEqual({ message: 'Не больше двух знаков после запятой' });
  expect(parsePrice('1.005', 100)).toEqual({ message: 'Не больше двух знаков после запятой' });
  expect(parsePrice('0,500', 100)).toEqual({ value: 0.5 });
});

test('should keep the value within the limit of the field', () => {
  expect(parsePrice('100', 100)).toEqual({ value: 100 });
  expect(parsePrice('100,01', 100)).toEqual({ message: 'Не больше 100' });
  expect(parsePrice('1000', 1000)).toEqual({ value: 1000 });
  expect(parsePrice('1001', 1000)).toEqual({ message: 'Не больше 1000' });
  expect(parsePrice('999999999999999999999999', 1000)).toEqual({ message: 'Не больше 1000' });
});
