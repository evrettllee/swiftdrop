import { expect, type Page, test } from '@playwright/test';
import { managerMenu } from './support/manager';
import { stubSupport, SUPPORT_PATH } from './support/manager-support';

test.use({ viewport: { width: 1440, height: 900 } });

function tabs(page: Page) {
  return page.getByRole('tablist', { name: 'Обращения' }).getByRole('tab');
}

function countRequests(stub: Awaited<ReturnType<typeof stubSupport>>) {
  return stub.listRequests.filter((search) => search.get('limit') === '1');
}

test('should count the tabs under the topic, the role and the search, and the menu without them', async ({
  page,
}) => {
  const stub = await stubSupport(page);
  stub.tickets[0].topic = 'payment';
  await page.goto(SUPPORT_PATH);
  await expect(tabs(page)).toHaveText(['Без ответа2', 'Открытые2', 'Закрытые1']);

  await page.goto(`${SUPPORT_PATH}?topic=payment`);
  await expect(tabs(page)).toHaveText(['Без ответа1', 'Открытые1', 'Закрытые0']);
  await expect
    .poll(() =>
      countRequests(stub)
        .slice(-3)
        .map((search) => `${search.get('view')}:${search.get('topic')}`)
        .toSorted(),
    )
    .toEqual(['awaiting:payment', 'closed:payment', 'open:payment']);
  await expect(managerMenu(page).getByRole('link', { name: /Поддержка/ })).toContainText('2');

  await page.getByRole('button', { name: 'Курьеры' }).click();
  await expect(tabs(page)).toHaveText(['Без ответа0', 'Открытые0', 'Закрытые0']);
  expect(countRequests(stub).at(-1)?.get('authorRole')).toBe('courier');

  await page.getByRole('button', { name: 'Все' }).click();
  await page.getByRole('searchbox', { name: 'Поиск обращений' }).fill('Анна');
  await expect(tabs(page)).toHaveText(['Без ответа1', 'Открытые1', 'Закрытые0']);
  await expect(managerMenu(page).getByRole('link', { name: /Поддержка/ })).toContainText('2');
});

test('should show on the apply button how many tickets the draft of the filters finds', async ({
  page,
}) => {
  const stub = await stubSupport(page);
  stub.tickets[0].topic = 'payment';
  stub.tickets[1].topic = 'app';
  await page.goto(SUPPORT_PATH);
  await page.getByRole('button', { name: /^Фильтры/ }).click();
  const panel = page.getByRole('dialog', { name: 'Фильтры' });

  await expect(panel.getByRole('button', { name: 'Показать 2 обращения' })).toBeVisible();
  await panel.getByText('Оплата', { exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Показать 1 обращение' })).toBeVisible();
  await panel.getByText('Аккаунт', { exact: true }).click();
  await panel.getByText('Оплата', { exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Показать 0 обращений' })).toBeVisible();
  expect(countRequests(stub).at(-1)?.get('topic')).toBe('account');
  expect(countRequests(stub).at(-1)?.get('view')).toBe('awaiting');
});
