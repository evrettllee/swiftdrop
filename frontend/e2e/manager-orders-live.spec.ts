import { expect, test } from '@playwright/test';
import { MANAGER_ORDERS_TEXTS } from '../src/pages/manager/orders/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  LIST_UNTIL,
  lastList,
  pushStaffOrder,
  settleRequests,
  stubManagerOrders,
} from './support/manager-orders';

const EVENT_WAIT_MS = 1_000;

test('should load the list and the counts again by events when nothing narrows the list', async ({
  page,
}) => {
  const stub = await stubManagerOrders(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);
  await expect(page.getByRole('table')).toBeVisible();
  await settleRequests(page);
  const lists = stub.lists.length;
  const counts = stub.counts.length;

  pushStaffOrder(stub, 'created', 48300);
  pushStaffOrder(stub, 'status', 48236);

  await expect.poll(() => stub.lists.length).toBe(lists + 1);
  await expect.poll(() => stub.counts.length).toBe(counts + 2);
  expect(lastList(stub).get('until')).toBeNull();
  await expect(page.getByText(/новы(й|х) заказ/)).toHaveCount(0);
});

test('should only count the new orders over a narrowed list and show them on demand', async ({
  page,
}) => {
  const stub = await stubManagerOrders(page);
  await page.goto(`${APP_ROUTES.MANAGER_ORDERS}?fragile=true`);
  await expect(page.getByRole('table')).toBeVisible();
  await settleRequests(page);
  const lists = stub.lists.length;
  const pageCounts = () => stub.counts.filter((url) => url.searchParams.has('fragile')).length;
  const counts = pageCounts();

  pushStaffOrder(stub, 'created', 48300);
  pushStaffOrder(stub, 'created', 48301);
  pushStaffOrder(stub, 'status', 48236);

  await expect(page.getByText('Появилось 2 новых заказа')).toBeVisible();
  await expect.poll(pageCounts).toBe(counts + 1);
  await page.waitForTimeout(EVENT_WAIT_MS);
  expect(stub.lists.length).toBe(lists);

  await page.getByRole('button', { name: MANAGER_ORDERS_TEXTS.SHOW_NEW, exact: true }).click();

  await expect.poll(() => stub.lists.length).toBe(lists + 1);
  expect(lastList(stub).get('until')).toBeNull();
  await expect(page.getByText('Появилось 2 новых заказа')).toHaveCount(0);
});

test('should keep the second page in place and go back to the first one on demand', async ({
  page,
}) => {
  const stub = await stubManagerOrders(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);
  await expect(page.getByText('1–20 из 148')).toBeVisible();
  await page.getByRole('button', { name: 'Следующая страница' }).click();
  await expect.poll(() => lastList(stub).get('page')).toBe('2');
  expect(lastList(stub).get('until')).toBe(String(LIST_UNTIL));
  await settleRequests(page);
  const lists = stub.lists.length;

  pushStaffOrder(stub, 'created', 48300);

  await expect(page.getByText('Появился 1 новый заказ')).toBeVisible();
  await page.waitForTimeout(EVENT_WAIT_MS);
  expect(stub.lists.length).toBe(lists);

  await page.getByRole('button', { name: MANAGER_ORDERS_TEXTS.SHOW_NEW, exact: true }).click();

  await expect(page).not.toHaveURL(/page=/);
  await expect.poll(() => lastList(stub).get('page')).toBe('1');
  expect(lastList(stub).get('until')).toBeNull();
});
