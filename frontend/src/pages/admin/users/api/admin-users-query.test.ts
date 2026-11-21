import { expect, test } from '@playwright/test';
import { buildAdminUserCountsQuery, buildAdminUsersQuery } from './admin-users-query';

const BASE = {
  role: 'client',
  status: ['active', 'invited', 'blocked'],
  q: null,
  vehicle: [],
  sort: 'newest',
  page: 1,
  limit: 20,
  until: null,
} as const;

test('should send the role, the statuses, the sort and the page', () => {
  expect(buildAdminUsersQuery(BASE).toString()).toBe(
    'role=client&status=active%2Cinvited%2Cblocked&sort=newest&page=1&limit=20',
  );
});

test('should send the search, the until and the vehicles of a courier', () => {
  const query = buildAdminUsersQuery({
    ...BASE,
    role: 'courier',
    q: 'Петров',
    vehicle: ['car', 'none'],
    page: 2,
    until: 812,
  });

  expect(Object.fromEntries(query)).toEqual({
    role: 'courier',
    status: 'active,invited,blocked',
    q: 'Петров',
    vehicle: 'car,none',
    sort: 'newest',
    page: '2',
    limit: '20',
    until: '812',
  });
});

test('should never send vehicles outside the couriers tab', () => {
  const query = buildAdminUsersQuery({ ...BASE, role: 'manager', vehicle: ['car'] });

  expect(query.has('vehicle')).toBe(false);
});

test('should send only the statuses and the search to the counts', () => {
  expect(Object.fromEntries(buildAdminUserCountsQuery({ status: ['deleted'], q: 'ivan' }))).toEqual(
    { status: 'deleted', q: 'ivan' },
  );
  expect(buildAdminUserCountsQuery({ status: ['active'], q: null }).toString()).toBe(
    'status=active',
  );
});
