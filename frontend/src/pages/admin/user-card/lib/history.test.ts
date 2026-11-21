import { expect, test } from '@playwright/test';
import type { HistoryEntry } from '../api/admin-user-card';
import { FIXTURE_ADMIN } from './card-fixture';
import { historyView, personShort } from './history';

const AT = new Date('2026-10-20T08:15:00Z');

function entry(action: string, details: HistoryEntry['details'] = {}): HistoryEntry {
  return { action, at: AT, actor: FIXTURE_ADMIN, details };
}

test('should name every action of an administrator on a user', () => {
  const cases: [HistoryEntry, string, string | null][] = [
    [entry('staff_invited', { role: 'courier' }), 'Приглашение отправлено', 'Роль: курьер'],
    [entry('staff_invited', { role: 'manager' }), 'Приглашение отправлено', 'Роль: менеджер'],
    [entry('invite_resent'), 'Приглашение отправлено заново', null],
    [entry('user_updated', { fields: ['phone'] }), 'Изменены данные', 'Телефон'],
    [
      entry('user_updated', { fields: ['firstName', 'lastName', 'phone'] }),
      'Изменены данные',
      'Имя, фамилия, телефон',
    ],
    [
      entry('role_changed', { from: 'courier', to: 'manager' }),
      'Роль изменена',
      'Курьер → менеджер',
    ],
    [entry('password_reset'), 'Пароль сброшен', 'Ссылка для нового пароля отправлена на почту'],
    [entry('sessions_ended'), 'Завершены все сеансы', null],
    [entry('user_blocked', { reason: 'спам в чате' }), 'Заблокирован', 'Причина: спам в чате'],
    [entry('user_unblocked'), 'Разблокирован', null],
    [entry('user_deleted'), 'Удалён, данные обезличены', 'Заказы и переписка сохранены'],
  ];

  for (const [item, title, details] of cases) {
    expect(historyView(item)).toMatchObject({ title, details });
  }
});

test('should date every row and name the administrator short', () => {
  expect(historyView(entry('sessions_ended'))?.meta).toMatch(/^20 окт 2026, \d{2}:15 · Андрей К\.$/);
});

test('should skip an action it does not know', () => {
  expect(historyView(entry('tariff_created'))).toBeNull();
});

test('should keep a block without a reason short', () => {
  expect(historyView(entry('user_blocked'))).toMatchObject({ title: 'Заблокирован', details: null });
});

test('should name a person by the first name and the initial of the last name', () => {
  expect(personShort({ firstName: 'Андрей', lastName: 'Ковалёв' })).toBe('Андрей К.');
  expect(personShort({ firstName: 'Удалённый пользователь', lastName: '' })).toBe(
    'Удалённый пользователь',
  );
});
