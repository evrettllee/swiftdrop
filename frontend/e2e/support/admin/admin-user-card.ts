import { type APIRequestContext, expect, type Page, request } from '@playwright/test';
import { API_BASE_PATH } from '../../../src/shared/api/request-config';
import { registerClient, type TestClient } from '../client/client';
import {
  inviteStaff,
  type IssuedLink,
  setPasswordThroughApi,
  STAND_PASSWORD,
  type StaffRole,
} from '../set-password';
import { STAND_FRONTEND_URL } from '../stand';

export type CardUser = { userId: number; email: string };

export function userCardPath(userId: number, listSearch = ''): string {
  return listSearch === '' ? `/admin/users/${userId}` : `/admin/users/${userId}?${listSearch}`;
}

export function cardDialog(page: Page, name: string | RegExp) {
  return page.getByRole('dialog', { name });
}

export function managePanel(page: Page) {
  return page.getByRole('region', { name: 'Управление' });
}

export function historyPanel(page: Page) {
  return page.getByRole('region', { name: 'История действий' });
}

export async function invitedStaff(api: APIRequestContext, role: StaffRole): Promise<IssuedLink> {
  return inviteStaff(api, role, 'Тест');
}

export async function activeStaff(api: APIRequestContext, role: StaffRole): Promise<IssuedLink> {
  const link = await inviteStaff(api, role, 'Тест');
  await setPasswordThroughApi(link.token, STAND_PASSWORD);

  return link;
}

export async function newClient(api: APIRequestContext): Promise<TestClient & { userId: number }> {
  const anonymous = await request.newContext({ baseURL: STAND_FRONTEND_URL });
  const client = await registerClient(anonymous);
  await anonymous.dispose();
  const search = new URLSearchParams({ role: 'client', q: client.email });
  const response = await api.get(`${API_BASE_PATH}/admin/users?${search.toString()}`);
  expect(response.ok(), await response.text()).toBe(true);
  const [found] = ((await response.json()) as { items: { userId: number }[] }).items;
  expect(found).toBeDefined();

  return { ...client, userId: found.userId };
}

export async function openCard(page: Page, userId: number, listSearch = ''): Promise<void> {
  await page.goto(userCardPath(userId, listSearch));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

export async function runAction(page: Page, action: string, dialogName: string | RegExp) {
  await managePanel(page).getByRole('button', { name: action, exact: true }).click();
  const dialog = cardDialog(page, dialogName);
  await expect(dialog).toBeVisible();

  return dialog;
}
