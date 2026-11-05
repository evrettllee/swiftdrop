import { expect, type Page, test } from '@playwright/test';
import { APP_ROUTES, getNewTicketPath } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { ORDER_ID, stubAuthorSupport } from './support/author-support';

function dialog(page: Page) {
  return page.getByRole('dialog', { name: 'Новое обращение' });
}

function topics(page: Page) {
  return dialog(page).getByRole('group', { name: 'Тема' }).getByRole('radio');
}

test('should open the new ticket from the list, send it and go to its thread', async ({ page }) => {
  const stub = await stubAuthorSupport(page);
  await page.goto(APP_ROUTES.SUPPORT);

  await page.getByRole('button', { name: 'Новое обращение' }).click();
  await expect(page).toHaveURL(`${APP_ROUTES.SUPPORT}?new=1`);
  await page.goBack();
  await expect(dialog(page)).toHaveCount(0);
  await page.goForward();
  await expect(topics(page)).toHaveCount(4);
  await expect(dialog(page).getByText('Опоздание, курьер, посылка')).toBeVisible();
  await expect(dialog(page).getByText('Пароль, вход, телефон')).toBeVisible();
  await expect(dialog(page).getByRole('radio', { name: /Проблема с заказом/ })).toBeChecked();
  await expect(dialog(page).getByRole('combobox', { name: 'Заказ' })).toHaveValue('');

  await dialog(page).getByRole('button', { name: 'Отправить' }).click();
  await expect(dialog(page).getByText('Напишите сообщение')).toBeVisible();
  expect(stub.created).toHaveLength(0);

  await dialog(page)
    .getByRole('radio', { name: /Оплата и возврат/ })
    .check({ force: true });
  await dialog(page).getByRole('combobox', { name: 'Заказ' }).selectOption(String(ORDER_ID));
  await expect(dialog(page).getByText('Заказ №48232')).toBeVisible();
  await dialog(page).getByRole('textbox', { name: 'Сообщение' }).fill('Деньги списали дважды');
  await expect(dialog(page).getByText('21 / 1000')).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Отправить' }).click();

  await expect(page).toHaveURL('/support/201');
  expect(stub.created).toEqual([
    { topic: 'payment', message: 'Деньги списали дважды', orderId: ORDER_ID },
  ]);
});

test('should take the order from the address and let it be changed or dropped', async ({
  page,
}) => {
  const stub = await stubAuthorSupport(page);
  await page.goto(getNewTicketPath(APP_ROUTES.SUPPORT, ORDER_ID));

  await expect(dialog(page).getByText('Заказ №48232')).toBeVisible();
  await expect(dialog(page).getByText(/^Сегодня, в пути, пр-т Притыцкого, 83$/)).toBeVisible();
  await dialog(page)
    .getByRole('button', { name: /Изменить/ })
    .click();
  await dialog(page).getByRole('combobox', { name: 'Заказ' }).selectOption('');
  await dialog(page).getByRole('textbox', { name: 'Сообщение' }).fill('Вопрос без заказа');
  await dialog(page).getByRole('button', { name: 'Отправить' }).click();

  await expect.poll(() => stub.created.length).toBe(1);
  expect(stub.created[0]).toEqual({ topic: 'order_problem', message: 'Вопрос без заказа' });
});

test('should ask the courier for a subject of «Другое» and send it', async ({ page }) => {
  const stub = await stubAuthorSupport(page, ROLE.COURIER);
  await page.goto(`${APP_ROUTES.COURIER_SUPPORT}?new=1`);

  await expect(topics(page)).toHaveCount(4);
  await expect(dialog(page).getByText('Не отвечает, не открывает')).toBeVisible();
  await expect(dialog(page).getByText('Ошибки, позиция не обновляется')).toBeVisible();
  await expect(dialog(page).getByRole('textbox', { name: 'Тема обращения' })).toHaveCount(0);
  await expect(dialog(page).getByRole('combobox', { name: 'Заказ' })).toContainText(
    'Заказ №990321',
  );

  await dialog(page).getByRole('radio', { name: 'Другое' }).check({ force: true });
  await dialog(page).getByRole('textbox', { name: 'Сообщение' }).fill('Нет предложений');
  await dialog(page).getByRole('button', { name: 'Отправить' }).click();
  await expect(dialog(page).getByText('Напишите тему обращения')).toBeVisible();

  await dialog(page).getByRole('textbox', { name: 'Тема обращения' }).fill('Не приходят заказы');
  await dialog(page).getByRole('button', { name: 'Отправить' }).click();
  await expect(page).toHaveURL('/courier/support/201');
  expect(stub.created).toEqual([
    { topic: 'other', subject: 'Не приходят заказы', message: 'Нет предложений' },
  ]);
});

test('should explain each refusal of a new ticket', async ({ page }) => {
  const stub = await stubAuthorSupport(page);
  await page.goto(getNewTicketPath(APP_ROUTES.SUPPORT, ORDER_ID));
  await dialog(page).getByRole('textbox', { name: 'Сообщение' }).fill('Где курьер?');

  stub.createAnswer = { status: 429, json: { message: 'Слишком много новых обращений' } };
  await dialog(page).getByRole('button', { name: 'Отправить' }).click();
  await expect(dialog(page).getByRole('alert')).toHaveText(
    'Можно создать не больше 5 обращений в час',
  );

  stub.createAnswer = {
    status: 400,
    json: {
      message: 'Ошибка валидации',
      errors: [{ field: 'message', message: 'Сообщение: от 1 до 1000 символов' }],
    },
  };
  await dialog(page).getByRole('button', { name: 'Отправить' }).click();
  await expect(dialog(page).getByText('Сообщение: от 1 до 1000 символов')).toBeVisible();
  await expect(dialog(page).getByRole('alert')).toHaveCount(0);

  stub.createAnswer = {
    status: 409,
    json: {
      code: 'TICKET_ALREADY_OPEN',
      message: 'По этому заказу у вас уже есть открытое обращение',
      ticketId: 91,
    },
  };
  await dialog(page).getByRole('button', { name: 'Отправить' }).click();
  await expect(page).toHaveURL('/support/91');
  await expect(
    page.getByRole('status').filter({ hasText: 'По этому заказу уже есть открытое обращение' }),
  ).toBeVisible();
});
