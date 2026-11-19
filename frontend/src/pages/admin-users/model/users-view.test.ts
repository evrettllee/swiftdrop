import { expect, test } from '@playwright/test';
import { readListParams, writeListParams } from '@/shared/lib/list-params';
import { USERS_PARAMS_CONFIG, type UsersParams } from '../config/list-params';
import {
  appliedFilters,
  filtersCount,
  FILTERS_RESET,
  statusOptions,
  tabPatch,
  toUsersQuery,
} from './users-view';

const DEFAULTS = USERS_PARAMS_CONFIG.defaults;

function read(search: string): UsersParams {
  return readListParams(new URLSearchParams(search), USERS_PARAMS_CONFIG);
}

test('should open the clients with the default statuses and the newest first', () => {
  expect(read('')).toEqual({
    role: 'client',
    q: null,
    status: ['active', 'invited', 'blocked'],
    vehicle: [],
    sort: 'newest',
    page: 1,
  });
});

test('should read the tab, the search, the filters, the sort and the page from the URL', () => {
  expect(
    read('role=courier&q=%20Петров%20&status=deleted,active&vehicle=none,car&sort=name&page=3'),
  ).toEqual({
    role: 'courier',
    q: 'Петров',
    status: ['active', 'deleted'],
    vehicle: ['car', 'none'],
    sort: 'name',
    page: 3,
  });
});

test('should drop broken values of the URL', () => {
  expect(read('role=admin&status=gone&vehicle=plane&sort=random&page=0&q=')).toEqual(DEFAULTS);
  expect(read(`q=${'a'.repeat(101)}`).q).toBeNull();
});

test('should keep the defaults out of the URL', () => {
  const written = writeListParams(
    new URLSearchParams(),
    { ...DEFAULTS, role: 'manager', status: ['active', 'invited', 'blocked'] },
    USERS_PARAMS_CONFIG,
  );

  expect(written.toString()).toBe('role=manager');
});

test('should hide invited from the statuses of the clients', () => {
  expect(statusOptions('client')).toEqual(['active', 'blocked', 'deleted']);
  expect(statusOptions('courier')).toEqual(['active', 'invited', 'blocked', 'deleted']);
});

test('should send the filters of the URL with the page and the until', () => {
  expect(
    toUsersQuery({ ...DEFAULTS, role: 'courier', q: 'ivan', vehicle: ['foot'] }, 2, 99),
  ).toEqual({
    role: 'courier',
    q: 'ivan',
    status: ['active', 'invited', 'blocked'],
    vehicle: ['foot'],
    sort: 'newest',
    page: 2,
    limit: 20,
    until: 99,
  });
});

test('should show no applied chips for the defaults', () => {
  expect(appliedFilters(DEFAULTS)).toEqual([]);
  expect(filtersCount(DEFAULTS)).toBe(0);
});

test('should show the search, the changed statuses and the vehicles as chips', () => {
  const values: UsersParams = {
    ...DEFAULTS,
    role: 'courier',
    q: 'Петрович',
    status: ['active', 'deleted'],
    vehicle: ['foot', 'none'],
  };

  expect(appliedFilters(values).map(({ name, value }) => `${name}: ${value}`)).toEqual([
    'Поиск: Петрович',
    'Статус: Активные, Удалённые',
    'Транспорт: Пеший, Не указан',
  ]);
  expect(filtersCount(values)).toBe(2);
  expect(appliedFilters(values).map(({ reset }) => reset)).toEqual([
    { q: null },
    { status: DEFAULTS.status },
    { vehicle: [] },
  ]);
});

test('should treat the clients without invited as the default statuses', () => {
  expect(appliedFilters({ ...DEFAULTS, status: ['active', 'blocked'] })).toEqual([]);
  expect(
    appliedFilters({ ...DEFAULTS, role: 'courier', status: ['active', 'blocked'] }),
  ).toHaveLength(1);
});

test('should ignore vehicles outside the couriers tab', () => {
  expect(appliedFilters({ ...DEFAULTS, role: 'manager', vehicle: ['car'] })).toEqual([]);
});

test('should drop the vehicles when the tab changes and reset all filters at once', () => {
  expect(tabPatch('manager')).toEqual({ role: 'manager', vehicle: [] });
  expect(FILTERS_RESET).toEqual({ q: null, status: DEFAULTS.status, vehicle: [] });
});
