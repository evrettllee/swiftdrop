import type { Page } from '@playwright/test';
import { ADMIN_LAYOUT_TEXTS } from '../../src/app/layouts/staff-layout/admin-navigation';
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

export async function openAsAdmin(
  page: Page,
): Promise<{ requests: StaffRequests; socket: AppSocketStub }> {
  await stubSession(page, ROLE.ADMIN);
  const requests = await countStaffRequests(page);
  const socket = await stubAppSocket(page);

  return { requests, socket };
}

export function adminMenu(page: Page) {
  return page.getByRole('navigation', { name: ADMIN_LAYOUT_TEXTS.NAV_LABEL });
}
