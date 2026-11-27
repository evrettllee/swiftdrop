import { expect, test } from '@playwright/test';
import { APP_ROUTES } from './app-routes';
import { ROLE_HOME_ROUTE } from './role-home';

test('should send each role to its own start page', () => {
  expect(ROLE_HOME_ROUTE).toEqual({
    client: APP_ROUTES.ORDERS,
    courier: APP_ROUTES.COURIER_WORK,
    manager: APP_ROUTES.MANAGER_ORDERS,
    admin: APP_ROUTES.ADMIN_USERS,
  });
});

test('should keep the admin start page apart from the manager sections', () => {
  expect(ROLE_HOME_ROUTE.admin).toBe('/admin/users');
  expect(ROLE_HOME_ROUTE.admin.startsWith('/manager')).toBe(false);
});
