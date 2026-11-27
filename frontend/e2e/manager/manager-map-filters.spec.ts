import { expect, type Page, test } from '@playwright/test';
import { MAP_PATH, mapCouriers, stubCouriersMap } from '../support/manager/manager-map';

function panel(page: Page) {
  return page.getByRole('region', { name: 'Курьеры на линии' });
}

function stateRadios(page: Page) {
  return page.getByRole('radiogroup', { name: 'Состояние' }).getByRole('radio');
}

test('should switch the single-select state radio group with keyboard arrows', async ({ page }) => {
  await stubCouriersMap(page);
  await page.goto(MAP_PATH);

  const all = stateRadios(page).filter({ hasText: 'Все' });
  const free = stateRadios(page).filter({ hasText: 'Свободны' });
  const noSignal = stateRadios(page).filter({ hasText: 'Нет связи' });

  await all.focus();
  await page.keyboard.press('ArrowRight');
  await expect(free).toBeFocused();
  await expect(free).toBeChecked();
  await expect(all).not.toBeChecked();
  await expect(page).toHaveURL(/state=free/);

  await page.keyboard.press('End');
  await expect(noSignal).toBeFocused();
  await expect(noSignal).toBeChecked();
  await expect(panel(page).getByRole('listitem')).toHaveCount(1);

  await page.keyboard.press('Home');
  await expect(all).toBeFocused();
  await expect(all).toBeChecked();
  await expect(page).toHaveURL(MAP_PATH);
});

test('should show loading, empty states, and recover from network errors', async ({ page }) => {
  const stub = await stubCouriersMap(page);
  let releaseLoad: () => void = () => undefined;
  const heldLoad = new Promise<void>((resolve) => {
    releaseLoad = resolve;
  });
  const holdHandler = async (route: Parameters<Parameters<Page['route']>[1]>[0]) => {
    await heldLoad;
    await route.fallback();
  };
  await page.route(/\/api\/manager\/couriers\/map(\?.*)?$/, holdHandler);
  await page.goto(MAP_PATH);
  await expect(panel(page).getByRole('status')).toBeVisible();
  releaseLoad();
  await page.unroute(/\/api\/manager\/couriers\/map(\?.*)?$/, holdHandler);
  await expect(panel(page).getByRole('listitem')).toHaveCount(5);

  stub.items = [];
  await page.goto(`${MAP_PATH}?state=on_order`);
  await expect(page.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible();
  await expect(page.getByText('Курьеров в этом состоянии сейчас нет.')).toBeVisible();

  await page.goto(MAP_PATH);
  await expect(page.getByRole('heading', { name: 'Курьеров на линии нет' })).toBeVisible();

  stub.status = 503;
  await page.goto(MAP_PATH);
  await expect(page.getByRole('alert')).toContainText('Не удалось загрузить курьеров');
  await expect(panel(page).getByRole('status')).toHaveCount(0);
  stub.status = 200;
  stub.items = mapCouriers();
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(panel(page).getByRole('listitem')).toHaveCount(5);
});
