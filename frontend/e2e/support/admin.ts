import type { Page } from '@playwright/test';
import { ADMIN_LAYOUT_TEXTS } from '../../src/app/layouts/staff-layout/admin-navigation';
import { ADMIN_USERS_API_PATHS } from '../../src/pages/admin-users/api/admin-users';
import { MANAGER_ORDERS_API_PATHS } from '../../src/shared/staff-api/manager-orders';
import { SUPPORT_STAFF_API_PATHS } from '../../src/shared/staff-api/support';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import { ROLE } from '../../src/shared/session/auth-user';
import { type AppSocketStub, stubAppSocket } from './app-socket';
import { stubSession } from './stub-session';

export type StaffRequests = {
  orderCounts: number;
  supportCounts: number;
};

async function countStaffRequests(page: Page): Promise<StaffRequests> {
  const requests: StaffRequests = { orderCounts: 0, supportCounts: 0 };

  await page.route(`**${API_BASE_PATH}${MANAGER_ORDERS_API_PATHS.COUNTS}`, (route) => {
    requests.orderCounts += 1;

    return route.fulfill({ status: 403, json: { message: 'Forbidden' } });
  });
  await page.route(`**${API_BASE_PATH}${SUPPORT_STAFF_API_PATHS.COUNTS}`, (route) => {
    requests.supportCounts += 1;

    return route.fulfill({ status: 403, json: { message: 'Forbidden' } });
  });

  return requests;
}

export async function stubAdminUsersApi(page: Page): Promise<void> {
  await page.route(`**${API_BASE_PATH}${ADMIN_USERS_API_PATHS.COUNTS}**`, (route) =>
    route.fulfill({ json: { client: 0, courier: 0, manager: 0 } }),
  );
  await page.route(`**${API_BASE_PATH}${ADMIN_USERS_API_PATHS.USERS}?**`, (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 1, limit: 20, until: null } }),
  );
}

export async function openAsAdmin(
  page: Page,
): Promise<{ requests: StaffRequests; socket: AppSocketStub }> {
  await stubSession(page, ROLE.ADMIN);
  await stubAdminUsersApi(page);
  const requests = await countStaffRequests(page);
  const socket = await stubAppSocket(page);

  return { requests, socket };
}

export function adminMenu(page: Page) {
  return page.getByRole('navigation', { name: ADMIN_LAYOUT_TEXTS.NAV_LABEL });
}
