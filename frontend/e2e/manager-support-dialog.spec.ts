import { expect, test } from '@playwright/test';
import { messagesOf, stubSupport, SUPPORT_PATH } from './support/manager-support';

test('should open a ticket from the link even when another tab is shown', async ({ page }) => {
  await stubSupport(page);
  await page.goto(`${SUPPORT_PATH}?ticket=93`);

  const dialog = page.getByRole('region', { name: 'Обращение' });
  await expect(
    dialog.getByRole('heading', { name: 'Не пришёл возврат за отменённый заказ' }),
  ).toBeVisible();
  await expect(dialog.getByText('Закрыто', { exact: true })).toBeVisible();
  await expect(
    dialog.getByText(/^Обращение закрыто \d\d\.\d\d, \d\d:\d\d · Ольга М\.$/),
  ).toBeVisible();
  await expect(dialog.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: /Без ответа/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('should show the author, the order and the messages and mark them read', async ({ page }) => {
  const stub = await stubSupport(page);
  await page.goto(SUPPORT_PATH);
  await page.getByRole('button', { name: /Анна Кравец/ }).click();

  await expect(page).toHaveURL(`${SUPPORT_PATH}?ticket=91`);
  const dialog = page.getByRole('region', { name: 'Обращение' });
  await expect(
    dialog.getByText(/^Анна Кравец, клиент, \+375 29 618-22-40, открыто в \d\d:\d\d$/),
  ).toBeVisible();
  await expect(dialog.getByText('Заказ №48232')).toBeVisible();
  await expect(dialog.getByText('В пути, курьер Андрей Король, +375 29 377-12-90')).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Открыть заказ' })).toHaveAttribute(
    'href',
    '/manager/orders/48232',
  );
  const log = dialog.getByRole('log', { name: 'Переписка' });
  await expect(log.getByText('Он уже 5 минут ищет')).toBeVisible();
  await expect(log.getByText('Анна Кравец').first()).toBeVisible();
  await expect.poll(() => stub.reads).toEqual([91]);
  expect(stub.socket.ticketJoins).toContain(91);
  await expect(page.getByRole('button', { name: /Анна Кравец/ })).toHaveAttribute(
    'aria-current',
    'true',
  );
});

test('should load the earlier messages on scroll up and keep the place', async ({ page }) => {
  const stub = await stubSupport(page);
  stub.messages.set(91, messagesOf(45));
  await page.goto(`${SUPPORT_PATH}?ticket=91`);

  const log = page.getByRole('log', { name: 'Переписка' });
  await expect(log.getByText('Сообщение 16', { exact: true })).toBeVisible();
  await expect(log.getByText('Сообщение 15', { exact: true })).toHaveCount(0);
  const anchor = log.getByText('Сообщение 16', { exact: true });
  await log.evaluate((element) => {
    element.scrollTop = 0;
  });

  await expect(log.getByText('Сообщение 1', { exact: true })).toHaveCount(1);
  expect(stub.messageRequests.at(-1)?.get('cursor')).toBe('16');
  const box = await anchor.boundingBox();
  const logBox = await log.boundingBox();
  expect(box?.y ?? 0).toBeGreaterThan(logBox?.y ?? 0);
});

test('should close the ticket after the confirmation', async ({ page }) => {
  const stub = await stubSupport(page);
  await page.goto(`${SUPPORT_PATH}?ticket=91`);

  await page.getByRole('button', { name: 'Закрыть обращение' }).click();
  const confirm = page.getByRole('dialog', { name: 'Закрыть обращение?' });
  await expect(confirm).toContainText('Клиент не сможет в нём писать');
  await confirm
    .getByRole('button')
    .filter({ hasText: /^Закрыть$/ })
    .click();

  await expect(confirm).toBeHidden();
  expect(stub.closes).toEqual([91]);
  const dialog = page.getByRole('region', { name: 'Обращение' });
  await expect(dialog.getByText(/^Обращение закрыто .* · Ольга М\.$/)).toBeVisible();
  await expect(dialog.getByRole('textbox')).toHaveCount(0);
});

test('should show a text with HTML as plain text', async ({ page }) => {
  const stub = await stubSupport(page);
  const html = '<b>жирный</b> <img src=x onerror="window.hacked=1">';
  stub.messages.set(91, [{ ...messagesOf(1)[0], text: html }]);
  await page.goto(`${SUPPORT_PATH}?ticket=91`);

  const log = page.getByRole('log', { name: 'Переписка' });
  await expect(log.getByText(html, { exact: true })).toBeVisible();
  await expect(log.locator('img, b')).toHaveCount(0);
  expect(await page.evaluate(() => 'hacked' in window)).toBe(false);
});
