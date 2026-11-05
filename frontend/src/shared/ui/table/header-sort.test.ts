import { expect, test } from '@playwright/test';
import { HEADER_SORT_DIRECTION, headerSortState, nextHeaderSort } from './header-sort';
import { TABLE_SORT } from './table-options';

test('should sort an inactive column descending first', () => {
  expect(nextHeaderSort('createdAt:desc', 'price')).toBe('price:desc');
});

test('should take the first direction the column asks for', () => {
  expect(nextHeaderSort('delivered:desc', 'name', HEADER_SORT_DIRECTION.ASC)).toBe('name:asc');
});

test('should turn the direction of the active column', () => {
  expect(nextHeaderSort('price:desc', 'price')).toBe('price:asc');
  expect(nextHeaderSort('price:asc', 'price')).toBe('price:desc');
});

test('should mark only the active column with its direction', () => {
  expect(headerSortState('price:asc', 'price')).toBe(TABLE_SORT.ASCENDING);
  expect(headerSortState('price:desc', 'price')).toBe(TABLE_SORT.DESCENDING);
  expect(headerSortState('price:desc', 'createdAt')).toBeUndefined();
});
