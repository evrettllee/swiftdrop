import { expect, type Page } from '@playwright/test';
import { ORDER_STATUS } from '../../src/shared/api/endpoints/order';
import { CALENDAR_PERIOD, calendarPeriod } from '../../src/shared/lib/calendar/period';
import { APP_ROUTES } from '../../src/shared/routes/app-routes';
import { ROLE } from '../../src/shared/session/auth-user';
import { stubOrderLive } from './app-socket';
import { buildOrderStubState, buildTestOrder, stubCourierOnOrder } from './courier-order';
import {
  fullHistory,
  type HistoryItemBody,
  type HistoryStub,
  stubHistory,
} from './courier-history';
import { stubSession } from './stub-session';

const COURIER_ORDER_ID = 990441;

export async function openCourierHistory(
  page: Page,
  search = '',
  items: HistoryItemBody[] = fullHistory(),
): Promise<HistoryStub> {
  await stubSession(page, ROLE.COURIER);
  await stubOrderLive(page);
  await stubCourierOnOrder(
    page,
    buildOrderStubState(buildTestOrder(COURIER_ORDER_ID, ORDER_STATUS.COURIER_ASSIGNED)),
  );
  const stub = await stubHistory(page, items);
  await page.goto(`${APP_ROUTES.COURIER_HISTORY}${search}`);
  await expect(page.getByRole('heading', { level: 1, name: 'История' })).toBeVisible();

  return stub;
}

export function weekOf(
  preset: typeof CALENDAR_PERIOD.THIS_WEEK | typeof CALENDAR_PERIOD.LAST_WEEK,
) {
  return calendarPeriod(preset, new Date());
}

export function summary(page: Page) {
  return page
    .locator('main p')
    .filter({ hasText: /доставк/ })
    .filter({ hasText: 'км' });
}

export function chips(page: Page) {
  return page.getByRole('group', { name: 'Применённые фильтры' });
}

export function periodButton(page: Page, label: string) {
  return page.getByRole('button', { name: `Период: ${label}` });
}

export function periodDialog(page: Page) {
  return page.getByRole('dialog', { name: 'Период' });
}
