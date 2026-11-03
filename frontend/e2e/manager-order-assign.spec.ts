import { expect, type Page, test } from '@playwright/test';
import { lastCandidateQuery, stubOrderActions } from './support/manager-actions';
import { awaitingOrder, MANAGER_ORDER_ID, stubManagerOrder } from './support/manager-order';

const ORDER_PATH = `/manager/orders/${MANAGER_ORDER_ID}`;
const TITLE = 'Назначить курьера на заказ №48231';

async function openAssign(page: Page) {
  const order = await stubManagerOrder(page, awaitingOrder());
  const actions = await stubOrderActions(page);
  await page.goto(ORDER_PATH);
  await page
    .getByRole('region', { name: 'Действия' })
    .getByRole('button', { name: 'Назначить курьера' })
    .click();
  const dialog = page.getByRole('dialog', { name: TITLE });
  await expect(dialog.getByRole('radio')).toHaveCount(6);

  return { order, actions, dialog };
}

test('should list the couriers with the transport chips, the distance and the unsuitable ones', async ({
  page,
}) => {
  const { dialog } = await openAssign(page);

  await expect(dialog.getByText('Подходят для посылки 2,5 кг: 4 курьера')).toBeVisible();
  await expect(dialog.getByRole('group', { name: 'Транспорт' }).getByRole('button')).toHaveText([
    'Все4',
    'Пеший1',
    'Велосипед1',
    'Самокат1',
    'Легковой1',
  ]);
  const korol = dialog.getByRole('radio', { name: /Андрей Король/ });
  await expect(korol).toBeEnabled();
  await expect(dialog.getByText('Легковой, позиция 12 с назад')).toBeVisible();
  await expect(dialog.getByText('Самокат, есть предложение по другому заказу')).toBeVisible();
  await expect(dialog.getByText('3,4 км')).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Не подходят сейчас' })).toBeVisible();
  await expect(dialog.getByText('Везёт другой заказ')).toBeVisible();
  await expect(dialog.getByText('Не на линии, Нет связи')).toBeVisible();
  await expect(dialog.getByRole('radio', { name: /Алина Гордей/ })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: 'Назначить', exact: true })).toBeDisabled();

  await dialog.getByRole('button', { name: /^Самокат/ }).click();
  await expect(dialog.getByText('Подходят для посылки 2,5 кг: 1 курьер')).toBeVisible();
  await expect(dialog.getByRole('radio')).toHaveCount(2);
  await expect(dialog.getByRole('button', { name: /^Самокат/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('should search from three letters after a pause and sort by the name', async ({ page }) => {
  const { actions, dialog } = await openAssign(page);
  const before = actions.candidateRequests.length;

  await dialog.getByRole('searchbox', { name: 'Поиск курьера' }).fill('Ег');
  await expect(dialog.getByText('Введите не меньше 3 символов')).toBeVisible();
  await page.waitForTimeout(600);
  expect(actions.candidateRequests).toHaveLength(before);

  await dialog.getByRole('searchbox', { name: 'Поиск курьера' }).fill('Егор');
  await expect.poll(() => lastCandidateQuery(actions).get('q')).toBe('Егор');
  expect(lastCandidateQuery(actions).get('sort')).toBe('pickupDistance:asc');

  await dialog.getByRole('combobox', { name: 'Сортировка курьеров' }).selectOption('name:asc');
  await expect.poll(() => lastCandidateQuery(actions).get('sort')).toBe('name:asc');
});

test('should assign the chosen courier, close the window and read the order again', async ({
  page,
}) => {
  const { order, actions, dialog } = await openAssign(page);
  const before = order.orderRequests.length;

  await dialog.locator('label', { hasText: 'Марина Лобач' }).click();
  await dialog.getByRole('button', { name: 'Назначить', exact: true }).click();

  await expect(dialog).toBeHidden();
  expect(actions.posts).toEqual([
    { orderId: MANAGER_ORDER_ID, action: 'assign', body: { courierId: 3 } },
  ]);
  await expect(
    page.getByRole('status').filter({ hasText: 'Заказ №48231: Марина Лобач' }),
  ).toContainText('Курьер назначен');
  await expect.poll(() => order.orderRequests.length).toBeGreaterThan(before);
});

test('should drop the chosen courier who became unavailable, with a notice', async ({ page }) => {
  const { order, actions, dialog } = await openAssign(page);

  await dialog.locator('label', { hasText: 'Андрей Король' }).click();
  actions.suitable = actions.suitable.filter(({ courierId }) => courierId !== 12);
  order.socket.push('staff:courier', { courierId: 12, kind: 'offline' });

  await expect(dialog.getByText('Курьер больше недоступен')).toBeVisible();
  await expect(dialog.getByRole('radio', { name: /Андрей Король/ })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Назначить', exact: true })).toBeDisabled();
});

test('should keep the chosen courier when the list is read again after a change of the order', async ({
  page,
}) => {
  const { order, actions, dialog } = await openAssign(page);
  const before = actions.candidateRequests.length;

  await dialog.locator('label', { hasText: 'Игорь Рыбак' }).click();
  order.socket.push('staff:order', {
    orderId: MANAGER_ORDER_ID + 1,
    kind: 'status',
    status: 'confirmed',
    statusChangedAt: new Date().toISOString(),
    courierId: null,
  });
  await page.waitForTimeout(1000);
  expect(actions.candidateRequests).toHaveLength(before);

  order.socket.push('staff:order', {
    orderId: MANAGER_ORDER_ID,
    kind: 'status',
    status: 'awaiting_manual_assignment',
    statusChangedAt: new Date().toISOString(),
    courierId: null,
  });
  await expect.poll(() => actions.candidateRequests.length).toBe(before + 1);
  await expect(dialog.getByRole('radio', { name: /Игорь Рыбак/ })).toBeChecked();
  await expect(dialog.getByText('Курьер больше недоступен')).toHaveCount(0);
});

test('should send one request for a double click', async ({ page }) => {
  const { actions, dialog } = await openAssign(page);
  let release = () => undefined as void;
  actions.hold = new Promise<void>((resolve) => {
    release = resolve;
  });

  await dialog.locator('label', { hasText: 'Андрей Король' }).click();
  await dialog.getByRole('button', { name: 'Назначить', exact: true }).dblclick();
  await page.waitForTimeout(300);
  release();

  await expect(dialog).toBeHidden();
  expect(actions.posts).toHaveLength(1);
});
