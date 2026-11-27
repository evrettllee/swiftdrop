import { expect, type Page, test } from '@playwright/test';
import { lastMapRequest, MAP_PATH, stubCouriersMap } from '../support/manager/manager-map';

const PHONE = { width: 375, height: 812 };

function panel(page: Page) {
  return page.getByRole('region', { name: 'Курьеры на линии' });
}

function transportButton(page: Page) {
  return page.getByRole('button', { name: 'Транспорт', exact: true });
}

function transportDialog(page: Page) {
  return page.getByRole('dialog', { name: /Транспорт|Фильтр по транспорту/ });
}

function applyButton(page: Page) {
  return transportDialog(page).getByRole('button', { name: /^Показать/ });
}

function appliedFilters(page: Page) {
  return page.getByRole('group', { name: 'Применённые фильтры' });
}

test('should select multiple vehicles via popover, show server count, and keep across reload', async ({
  page,
}) => {
  const stub = await stubCouriersMap(page);
  await page.goto(MAP_PATH);

  await expect(appliedFilters(page)).toHaveCount(0);
  await expect(transportButton(page)).toHaveText('Транспорт');

  await transportButton(page).click();
  const dialog = transportDialog(page);
  await expect(dialog).toBeVisible();
  await expect(applyButton(page)).toHaveText('Показать 5 курьеров');

  await dialog.getByRole('checkbox', { name: 'Легковой' }).check({ force: true });
  await expect(applyButton(page)).toHaveText('Показать 2 курьеров');
  await dialog.getByRole('checkbox', { name: 'Пеший' }).check({ force: true });
  await expect(applyButton(page)).toHaveText('Показать 3 курьеров');

  await applyButton(page).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/vehicleType=foot(%2C|,)car$/);
  await expect.poll(() => lastMapRequest(stub).get('vehicleType')).toBe('foot,car');
  await expect(transportButton(page)).toHaveText('Транспорт2');
  await expect(panel(page).getByRole('listitem')).toHaveCount(3);
  await expect(appliedFilters(page).getByRole('button', { name: /Убрать фильтр/ })).toHaveCount(2);
  await expect(
    appliedFilters(page).getByRole('button', { name: 'Убрать фильтр Транспорт: Пеший' }),
  ).toBeVisible();
  await expect(
    appliedFilters(page).getByRole('button', { name: 'Убрать фильтр Транспорт: Легковой' }),
  ).toBeVisible();

  await page.reload();
  await expect(transportButton(page)).toHaveText('Транспорт2');
  await expect(panel(page).getByRole('listitem')).toHaveCount(3);
  await transportButton(page).click();
  await expect(transportDialog(page).getByRole('checkbox', { name: 'Пеший' })).toBeChecked();
  await expect(transportDialog(page).getByRole('checkbox', { name: 'Легковой' })).toBeChecked();
  await expect(transportDialog(page).getByRole('checkbox', { name: 'Самокат' })).not.toBeChecked();
});

test('should clear single vehicle chip, reset all chips, and reset inside panel while keeping other filters', async ({
  page,
}) => {
  const stub = await stubCouriersMap(page);
  await page.goto(`${MAP_PATH}?state=on_order&vehicleType=foot,car&q=Король`);
  await expect(panel(page).getByRole('listitem')).toHaveCount(1);

  await appliedFilters(page)
    .getByRole('button', { name: 'Убрать фильтр Транспорт: Пеший' })
    .click();
  await expect(page).toHaveURL(/state=on_order/);
  await expect(page).toHaveURL(/vehicleType=car/);
  await expect(page).toHaveURL(/q=%D0%9A%D0%BE%D1%80%D0%BE%D0%BB%D1%8C/);
  await expect(transportButton(page)).toHaveText('Транспорт1');
  await expect(appliedFilters(page).getByRole('button', { name: /Убрать фильтр/ })).toHaveCount(1);

  await appliedFilters(page).getByRole('button', { name: 'Сбросить всё' }).click();
  await expect(appliedFilters(page)).toHaveCount(0);
  await expect(transportButton(page)).toHaveText('Транспорт');
  await expect(page).toHaveURL(/state=on_order/);
  await expect(page).toHaveURL(/q=%D0%9A%D0%BE%D1%80%D0%BE%D0%BB%D1%8C/);
  await expect(page).not.toHaveURL(/vehicleType=/);
  await expect.poll(() => lastMapRequest(stub).get('vehicleType')).toBeNull();

  await transportButton(page).click();
  const dialog = transportDialog(page);
  await dialog.getByRole('checkbox', { name: 'Грузовой' }).check({ force: true });
  await expect(applyButton(page)).toHaveText('Показать 0 курьеров');
  await applyButton(page).click();
  await expect(page.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible();

  await transportButton(page).click();
  await dialog.getByRole('button', { name: 'Сбросить' }).click();
  await expect(dialog.getByRole('checkbox', { name: 'Грузовой' })).not.toBeChecked();
  await applyButton(page).click();
  await expect(page).not.toHaveURL(/vehicleType=/);
  await expect(panel(page).getByRole('listitem')).toHaveCount(1);
});

test('should show empty state for vehicle filter and open transport sheet on mobile', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await stubCouriersMap(page);
  await page.goto(`${MAP_PATH}?vehicleType=truck`);

  await expect(page.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible();
  await expect(page.getByText('Курьеров по выбранным фильтрам сейчас нет.')).toBeVisible();

  await transportButton(page).click();
  const dialog = transportDialog(page);
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Сбросить' }).click();
  await expect(applyButton(page)).toHaveText('Показать 5 курьеров');
  await applyButton(page).click();

  await expect(dialog).toBeHidden();
  await expect(panel(page).getByRole('listitem')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(PHONE.width);
});
