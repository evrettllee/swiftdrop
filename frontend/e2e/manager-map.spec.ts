import { expect, type Page, test } from '@playwright/test';
import { MANAGER_ORDER_ID } from './support/manager-order-fixtures';
import {
  lastMapRequest,
  MAP_PATH,
  mapCouriers,
  OFFER_ORDER_ID,
  stubCouriersMap,
} from './support/manager-map';

function panel(page: Page) {
  return page.getByRole('region', { name: 'Курьеры на линии' });
}

function mapRegion(page: Page) {
  return page.getByRole('region', { name: 'Карта курьеров на линии' });
}

function chips(page: Page) {
  return page.getByRole('group', { name: 'Состояние' }).getByRole('button');
}

test('should list the couriers with the chips of the states and their counts', async ({ page }) => {
  await stubCouriersMap(page);
  await page.goto(MAP_PATH);

  await expect(chips(page)).toHaveText(['Все5', 'Свободны3', 'С заказом1', 'Нет связи1']);
  const rows = panel(page).getByRole('listitem');
  await expect(rows).toHaveCount(5);
  await expect(rows.filter({ hasText: 'Алина Гордей' })).toContainText('СамокатСвободен');
  await expect(rows.filter({ hasText: 'Егор Тарасевич' })).toContainText('Предложение');
  await expect(rows.filter({ hasText: 'Никита Волчек' })).toContainText('Нет связи 4 мин');
  await expect(rows.filter({ hasText: 'Игорь Рыбак' })).toContainText('Пеший');
  await expect(
    mapRegion(page).getByRole('button', { name: /, (Свободен|С заказом|Предложение|Нет связи)$/ }),
  ).toHaveCount(5);
});

test('should keep the state, the search and the transport in the address', async ({ page }) => {
  const stub = await stubCouriersMap(page);
  await page.goto(`${MAP_PATH}?vehicleType=car`);
  await expect(chips(page)).toHaveCount(4);
  expect(lastMapRequest(stub).get('vehicleType')).toBe('car');

  await chips(page).filter({ hasText: 'Свободны' }).click();
  await expect(page).toHaveURL(/state=free/);
  await expect.poll(() => lastMapRequest(stub).get('state')).toBe('free,offer');
  await expect(panel(page).getByRole('listitem')).toHaveCount(3);

  await page.getByRole('searchbox', { name: 'Поиск курьера' }).fill('Ег');
  await expect(page.getByText('Введите не меньше 3 символов')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Поиск курьера' }).fill('Егор');
  await expect(page).toHaveURL(/q=%D0%95%D0%B3%D0%BE%D1%80/);
  await expect.poll(() => lastMapRequest(stub).get('q')).toBe('Егор');

  await page.reload();
  await expect(page.getByRole('searchbox', { name: 'Поиск курьера' })).toHaveValue('Егор');
  await expect(chips(page).filter({ hasText: 'Свободны' })).toHaveAttribute('aria-pressed', 'true');
});

test('should select a courier by the row and by the marker, the courier in the address', async ({
  page,
}) => {
  await stubCouriersMap(page);
  await page.goto(MAP_PATH);

  const row = panel(page).getByRole('button', { name: /Алина Гордей/ });
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/courier=1/);
  const marker = mapRegion(page).getByRole('button', { name: 'Алина Гордей, Свободен' });
  await expect(marker).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('region', { name: 'Курьер Алина Гордей' })).toBeVisible();

  await mapRegion(page).getByRole('button', { name: 'Игорь Рыбак, Свободен' }).click();
  await expect(page).toHaveURL(/courier=5/);
  await expect(panel(page).getByRole('button', { name: /Игорь Рыбак/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(marker).toHaveAttribute('aria-pressed', 'false');

  await page.reload();
  const card = page.getByRole('region', { name: 'Курьер Игорь Рыбак' });
  await expect(card).toBeVisible();
  await expect(card.getByRole('link', { name: 'Позвонить курьеру' })).toHaveCount(0);
  await card.getByRole('button', { name: 'Закрыть' }).click();
  await expect(card).toBeHidden();
  await expect(page).not.toHaveURL(/courier=/);
});

test('should show the order and the time to the recipient of a courier on the way', async ({
  page,
}) => {
  const stub = await stubCouriersMap(page);
  await page.goto(`${MAP_PATH}?courier=2`);

  const card = page.getByRole('region', { name: 'Курьер Андрей Король' });
  await expect(card.getByRole('link', { name: `№${MANAGER_ORDER_ID}, в пути` })).toHaveAttribute(
    'href',
    `/manager/orders/${MANAGER_ORDER_ID}`,
  );
  await expect(card).toContainText('До получателя≈ 12 мин');
  await expect(card).toContainText(/Позиция\d+ с назад/);
  await expect(card.getByRole('link', { name: 'Позвонить курьеру' })).toHaveAttribute(
    'href',
    'tel:+375293771290',
  );
  await expect(card.getByRole('link', { name: 'Открыть заказ' })).toBeVisible();
  expect(new Set(stub.orderRequests)).toEqual(new Set([MANAGER_ORDER_ID]));
});

test('should leave out the time without an estimate and link the offered order', async ({
  page,
}) => {
  const stub = await stubCouriersMap(page);
  stub.order = { ...stub.order, estimatedDeliveryAt: null };
  await page.goto(`${MAP_PATH}?courier=2`);

  const card = page.getByRole('region', { name: 'Курьер Андрей Король' });
  await expect(card.getByRole('link', { name: /в пути/ })).toBeVisible();
  await expect.poll(() => stub.orderRequests.length).toBeGreaterThan(0);
  await expect(card).not.toContainText('До получателя');
  const orderRequests = stub.orderRequests.length;

  await panel(page)
    .getByRole('button', { name: /Егор Тарасевич/ })
    .click();
  const offer = page.getByRole('region', { name: 'Курьер Егор Тарасевич' });
  await expect(offer).toContainText('СостояниеПредложение');
  await expect(
    offer.getByRole('link', { name: `Предложение по заказу №${OFFER_ORDER_ID}` }),
  ).toBeVisible();
  expect(stub.orderRequests).toHaveLength(orderRequests);
});

test('should show the empty result and a failed load', async ({ page }) => {
  const stub = await stubCouriersMap(page);
  stub.items = [];
  await page.goto(`${MAP_PATH}?q=Лиса`);
  await expect(page.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible();
  await expect(page.getByText('По запросу «Лиса» курьеров нет.')).toBeVisible();

  stub.status = 503;
  await page.goto(MAP_PATH);
  await expect(page.getByRole('alert')).toContainText('Не удалось загрузить курьеров');
  stub.status = 200;
  stub.items = mapCouriers();
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(panel(page).getByRole('listitem')).toHaveCount(5);
});
