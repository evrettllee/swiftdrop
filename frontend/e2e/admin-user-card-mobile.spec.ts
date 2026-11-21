import { expect, type Locator, test } from '@playwright/test';
import { DIALOG_TEXTS as DIALOG } from '../src/pages/admin/user-card/config/dialog-texts';
import { USER_CARD_TEXTS as TEXTS } from '../src/pages/admin/user-card/config/texts';
import { type AdminSession, openAdminSession, PHONE_VIEWPORT } from './support/admin-users';
import { activeStaff, openCard, runAction } from './support/admin-user-card';
import { expectNoOverflow } from './support/set-password';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser, PHONE_VIEWPORT);
});

test.afterAll(async () => {
  await session.context.close();
});

async function topOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();

  return box?.y ?? 0;
}

async function expectPrimaryOnTop(dialog: Locator, primary: string): Promise<void> {
  const primaryTop = await topOf(dialog.getByRole('button', { name: primary }));
  const cancelTop = await topOf(dialog.getByRole('button', { name: DIALOG.CANCEL }));
  expect(primaryTop).toBeLessThan(cancelTop);
}

test('should lay the card out in one column with a way back to the tab', async () => {
  const { page, api } = session;
  const courier = await activeStaff(api, 'courier');
  await openCard(page, courier.userId);

  await expect(page.getByRole('link', { name: 'Курьеры' })).toBeVisible();
  const order = [TEXTS.CONTACTS, TEXTS.WORK, TEXTS.DELIVERIES, TEXTS.MANAGEMENT, TEXTS.HISTORY];
  const tops: number[] = [];

  for (const name of order) {
    tops.push(await topOf(page.getByRole('region', { name })));
  }

  expect(tops).toEqual([...tops].sort((first, second) => first - second));
  await expectNoOverflow(page);

  const role = await runAction(page, 'Сменить роль', DIALOG.ROLE_TITLE);
  await expectPrimaryOnTop(role, DIALOG.ROLE_CONFIRM);
  await expectNoOverflow(page);
  await page.keyboard.press('Escape');
  await expect(role).toBeHidden();

  const block = await runAction(page, 'Заблокировать', DIALOG.BLOCK_TITLE);
  await expect(block.getByLabel(DIALOG.REASON)).toBeVisible();
  await expectPrimaryOnTop(block, DIALOG.BLOCK_CONFIRM);
  await block.getByRole('button', { name: DIALOG.CANCEL }).click();
  await expect(block).toBeHidden();
});
