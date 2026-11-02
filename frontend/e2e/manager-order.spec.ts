import { expect, type Page, test } from '@playwright/test';
import {
  assignedOrder,
  awaitingOrder,
  cancelledOrder,
  deliveredOrder,
  MANAGER_ORDER_ID,
  stubManagerOrder,
} from './support/manager-order';

const ORDER_PATH = `/manager/orders/${MANAGER_ORDER_ID}`;

function heading(page: Page, name: string | RegExp) {
  return page.getByRole('heading', { level: 2, name });
}

function actions(page: Page) {
  return page.getByRole('region', { name: 'Действия' });
}

test('should show an order that waits for a manager with the offers and its actions', async ({
  page,
}) => {
  await stubManagerOrder(page, awaitingOrder());
  await page.goto(ORDER_PATH);

  const crumbs = page.getByRole('navigation', { name: 'Хлебные крошки' });
  await expect(crumbs.getByRole('link', { name: 'Заказы' })).toHaveAttribute(
    'href',
    '/manager/orders',
  );
  await expect(page.getByRole('heading', { level: 1, name: 'Заказ №48231' })).toBeVisible();
  await expect(page.getByRole('status').getByText('Ждёт назначения').first()).toBeVisible();
  await expect(heading(page, 'Автоназначение не нашло курьера')).toBeVisible();
  await expect(
    page.getByText('Заказ предлагали 3 курьерам, никто не принял. Ждёт назначения 35 мин.'),
  ).toBeVisible();

  const offers = page.getByRole('table');
  await expect(offers.getByRole('row')).toHaveCount(4);
  await expect(offers.getByRole('cell', { name: 'Нет ответа' })).toBeVisible();
  await expect(offers.getByRole('cell', { name: 'Отказ' })).toBeVisible();
  await expect(offers.getByRole('cell', { name: 'Отозвано' })).toBeVisible();

  await expect(actions(page).getByRole('button')).toHaveText([
    'Назначить курьера',
    'Запустить автоназначение',
    'Отменить заказ',
  ]);
  await expect(page.getByRole('region', { name: 'Обращения по заказу' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Оплата' }).getByText('Оплачено')).toBeVisible();
  await expect(page.getByText('Виктор Шуляк')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Виктор Шуляк' })).toHaveCount(0);
});

test('should open an empty window named after the action and close it', async ({ page }) => {
  await stubManagerOrder(page, awaitingOrder());
  await page.goto(ORDER_PATH);

  const cases = [
    ['Назначить курьера', 'Назначить курьера на заказ №48231'],
    ['Запустить автоназначение', 'Запустить автоназначение для заказа №48231?'],
    ['Отменить заказ', 'Отменить заказ №48231?'],
  ] as const;

  for (const [button, title] of cases) {
    await actions(page).getByRole('button', { name: button }).click();
    const dialog = page.getByRole('dialog', { name: title });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Закрыть' }).first().click();
    await expect(dialog).toHaveCount(0);
  }
});

test('should show the courier assigned by hand, who assigned and the ticket of the order', async ({
  page,
}) => {
  await stubManagerOrder(page, assignedOrder());
  await page.goto(ORDER_PATH);

  await expect(heading(page, 'Курьер приедет за посылкой через 9 мин')).toBeVisible();
  await expect(
    page.getByText(
      /^Назначен вручную в \d{2}:\d{2}, Ольга М\. Доставка ориентировочно к \d{2}:\d{2}\.$/,
    ),
  ).toBeVisible();

  const courier = page.getByRole('region', { name: 'Курьер', exact: true });
  await expect(courier.getByText('Андрей Король')).toBeVisible();
  await expect(
    courier.getByText('Легковой, Renault Logan, 4521 KE-7, +375 29 377-12-90'),
  ).toBeVisible();
  await expect(courier.getByRole('link', { name: 'Позвонить курьеру' })).toHaveAttribute(
    'href',
    'tel:+375293771290',
  );
  await expect(actions(page).getByRole('button')).toHaveText([
    'Переназначить курьера',
    'Запустить автоназначение',
    'Отменить заказ',
  ]);
  await expect(actions(page).getByText('Можно, пока курьер не забрал посылку.')).toBeVisible();

  await courier.getByRole('button', { name: 'Переназначить' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Переназначить курьера на заказе №48231' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  const ticket = page.getByRole('link', { name: /Курьер не может найти подъезд/ });
  await expect(ticket).toHaveAttribute('href', '/manager/support?ticket=91');
  await expect(ticket).toContainText(/Клиент, \d{2}:\d{2}, ждёт ответа 4 мин/);

  const progress = page.getByRole('region', { name: 'Ход заказа' });
  await expect(progress.getByRole('listitem').filter({ hasText: 'Курьер назначен' })).toContainText(
    'Ольга М.',
  );
});

test('should show a delivered order without actions', async ({ page }) => {
  await stubManagerOrder(page, deliveredOrder());
  await page.goto(ORDER_PATH);

  await expect(heading(page, /^Доставлен в \d{2}:\d{2}$/)).toBeVisible();
  await expect(page.getByText('Получатель: Светлана Шуляк.')).toBeVisible();
  await expect(actions(page)).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Ход заказа' }).getByText('Курьер', { exact: true }),
  ).toBeVisible();
});

test('should show who cancelled the order and why, with the refund', async ({ page }) => {
  await stubManagerOrder(page, cancelledOrder());
  await page.goto(ORDER_PATH);

  await expect(heading(page, 'Заказ отменён')).toBeVisible();
  await expect(
    page.getByText(
      /^Отменён сотрудником в \d{2}:\d{2}, Ольга М\. Причина: Адрес доставки вне зоны$/,
    ),
  ).toBeVisible();

  const progress = page.getByRole('region', { name: 'Ход заказа' });
  await expect(progress.getByRole('listitem').last()).toContainText('Отменён');
  await expect(progress.getByRole('listitem').last()).toContainText(
    'Ольга М. · Адрес доставки вне зоны',
  );
  await expect(
    page.getByRole('region', { name: 'Оплата' }).getByText('Деньги возвращены'),
  ).toBeVisible();
  await expect(actions(page)).toHaveCount(0);
});
