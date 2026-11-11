import { expect, test } from '@playwright/test';
import { withoutLegacyFilter } from './legacy-filter';

function convert(search: string): string | null {
  return withoutLegacyFilter(new URLSearchParams(search))?.toString() ?? null;
}

test('should leave an address without the old filter as it is', () => {
  expect(convert('')).toBeNull();
  expect(convert('status=active&q=48232')).toBeNull();
});

test('should turn the old filters into the groups of statuses', () => {
  expect(convert('filter=active')).toBe('status=active');
  expect(convert('filter=finished')).toBe('status=finished');
});

test('should drop the old filter of all the orders and an unknown one', () => {
  expect(convert('filter=all')).toBe('');
  expect(convert('filter=archived')).toBe('');
});

test('should keep the other parameters and a status already given', () => {
  expect(convert('q=Немига&filter=active&page=2')).toBe(
    'q=%D0%9D%D0%B5%D0%BC%D0%B8%D0%B3%D0%B0&page=2&status=active',
  );
  expect(convert('status=cancelled&filter=active')).toBe('status=cancelled');
});
