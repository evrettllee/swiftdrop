import { expect, test } from '@playwright/test';
import { USER_ACTION } from '../config/actions';
import { cardFixture, FIXTURE_ADMIN } from './card-fixture';
import {
  courierNow,
  lastLoginText,
  listPathOf,
  loginMethods,
  managementGroups,
  ordersSummary,
  stateAlert,
} from './card-view';

const { EDIT, ROLE, RESET, SESSIONS, RESEND, BLOCK, UNBLOCK, DELETE } = USER_ACTION;
const AT = new Date('2026-11-12T07:15:00Z');

test('should give an active staff member every action, block in the second group', () => {
  expect(managementGroups(cardFixture())).toEqual([
    [EDIT, ROLE, RESET, SESSIONS],
    [BLOCK, DELETE],
  ]);
  expect(managementGroups(cardFixture({ role: 'manager', courier: null }))).toEqual([
    [EDIT, ROLE, RESET, SESSIONS],
    [BLOCK, DELETE],
  ]);
});

test('should offer unblocking to a blocked user instead of blocking', () => {
  expect(managementGroups(cardFixture({ status: 'blocked' }))).toEqual([
    [EDIT, ROLE, RESET, SESSIONS],
    [UNBLOCK, DELETE],
  ]);
  expect(managementGroups(cardFixture({ role: 'client', status: 'blocked' }))).toEqual([
    [SESSIONS],
    [UNBLOCK, DELETE],
  ]);
});

test('should leave a client only sessions, blocking and deleting', () => {
  expect(managementGroups(cardFixture({ role: 'client', courier: null }))).toEqual([
    [SESSIONS],
    [BLOCK, DELETE],
  ]);
});

test('should let an invited member be edited, invited again or deleted', () => {
  expect(managementGroups(cardFixture({ status: 'invited' }))).toEqual([[EDIT, RESEND], [DELETE]]);
});

test('should give a deleted user no management at all', () => {
  expect(managementGroups(cardFixture({ status: 'deleted' }))).toEqual([]);
});

test('should name the ways to sign in as one phrase', () => {
  const login = (password: boolean, google: boolean, yandex: boolean) =>
    loginMethods(cardFixture({ login: { password, google, yandex } }));

  expect(login(true, false, false)).toBe('Пароль');
  expect(login(true, true, false)).toBe('Пароль и Google');
  expect(login(true, true, true)).toBe('Пароль, Google и Яндекс');
  expect(login(false, false, true)).toBe('Яндекс');
  expect(login(false, false, false)).toBe('Не задан');
});

test('should say an invited member has no password and a deleted user has nothing', () => {
  const none = { password: false, google: false, yandex: false };

  expect(loginMethods(cardFixture({ status: 'invited', login: none }))).toBe('Пароль не создан');
  expect(loginMethods(cardFixture({ status: 'deleted', login: none }))).toBe('Удалён');
});

test('should tell what the courier does now', () => {
  const courier = cardFixture().courier!;

  expect(courierNow({ ...courier, activeOrderId: 10517, isAvailable: true })).toBe(
    'Везёт заказ №10517',
  );
  expect(courierNow({ ...courier, isAvailable: true })).toBe('На линии');
  expect(courierNow({ ...courier, isAvailable: false })).toBe('Не на линии');
});

test('should sum the orders of a client and the deliveries of a courier, without zeros', () => {
  const recent = [
    {
      orderId: 1,
      createdAt: AT,
      from: 'ул. Немига, 5',
      to: 'ул. Кульман, 3',
      price: 9.23,
      status: 'delivered' as const,
    },
  ];
  const client = (total: number, delivered: number, cancelled: number) =>
    ordersSummary(
      cardFixture({
        role: 'client',
        courier: null,
        orders: { total, delivered, cancelled, recent },
      }),
    );

  expect(client(12, 11, 1)).toBe('Всего 12, доставлено 11, отменено 1');
  expect(client(3, 3, 0)).toBe('Всего 3, доставлено 3');
  expect(client(2, 0, 0)).toBe('Всего 2');
  expect(
    ordersSummary(cardFixture({ orders: { total: 151, delivered: 148, cancelled: 3, recent } })),
  ).toBe('Доставлено 148, отменено 3');
  expect(ordersSummary(cardFixture())).toBeNull();
});

test('should show the last sign-in today as today and say when there was none', () => {
  const now = new Date('2026-11-20T15:00:00Z');

  expect(lastLoginText(new Date('2026-11-20T06:12:00Z'), now)).toMatch(/^Сегодня, \d{2}:12$/);
  expect(lastLoginText(new Date('2026-11-11T18:07:00Z'), now)).toMatch(/^11 ноя 2026, \d{2}:07$/);
  expect(lastLoginText(null, now)).toBe('Входов не было');
});

test('should return to the list the card was opened from, or to the tab of its role', () => {
  const search = 'role=courier&status=active%2Cblocked&page=2';

  expect(listPathOf('courier', search)).toBe(`/admin/users?${search}`);
  expect(listPathOf('manager', search)).toBe('/admin/users?role=manager');
  expect(listPathOf('client', '')).toBe('/admin/users?role=client');
  expect(listPathOf('client', 'q=%D0%B0')).toBe('/admin/users?q=%D0%B0');
});

test('should explain the block with the reason and who did it', () => {
  const alert = stateAlert(
    cardFixture({
      status: 'blocked',
      block: { reason: 'оскорбления курьеров в чате заказа', at: AT, by: FIXTURE_ADMIN },
    }),
  );

  expect(alert?.variant).toBe('error');
  expect(alert?.title).toMatch(/^Аккаунт заблокирован 12 ноя 2026, \d{2}:15$/);
  expect(alert?.text).toBe('Причина: оскорбления курьеров в чате заказа. Заблокировал: Андрей К.');
});

test('should tell until when the invitation works and when it has run out', () => {
  const sent = stateAlert(
    cardFixture({
      status: 'invited',
      invite: { sentAt: AT, expiresAt: new Date('2026-11-15T07:58:00Z') },
    }),
  );

  expect(sent?.variant).toBe('info');
  expect(sent?.title).toMatch(/^Приглашение отправлено 12 ноя 2026, \d{2}:15$/);
  expect(sent?.text).toMatch(
    /^Сотрудник ещё не создал пароль\. Ссылка действует до 15 ноя, \d{2}:58\.$/,
  );
  expect(stateAlert(cardFixture({ status: 'invited', invite: null }))).toEqual({
    variant: 'info',
    kind: 'invite',
    title: 'Ссылка-приглашение истекла',
    text: 'Сотрудник не создал пароль. Отправьте приглашение заново.',
  });
});

test('should say the data of a deleted user is gone and who removed it', () => {
  const alert = stateAlert(
    cardFixture({ status: 'deleted', deletion: { at: AT, by: FIXTURE_ADMIN } }),
  );

  expect(alert?.title).toMatch(/^Данные обезличены 12 ноя 2026, \d{2}:15$/);
  expect(alert?.text).toBe(
    'Имя, email и телефон удалены. Заказы и переписка сохранены без личных данных. Удалил: Андрей К.',
  );
  expect(stateAlert(cardFixture())).toBeNull();
});
