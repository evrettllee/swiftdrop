import { expect, test } from '@playwright/test';
import { getExplanation } from './explanation';

test('should name the courier role in an invite', () => {
  expect(getExplanation({ kind: 'invite', firstName: 'Иван', role: 'courier' })).toBe(
    'Иван, вас пригласили в SwiftDrop как курьера. Придумайте пароль, чтобы войти.',
  );
});

test('should name the manager role in an invite', () => {
  expect(getExplanation({ kind: 'invite', firstName: 'Ольга', role: 'manager' })).toBe(
    'Ольга, вас пригласили в SwiftDrop как менеджера. Придумайте пароль, чтобы войти.',
  );
});

test('should not name a role in a reset', () => {
  for (const role of ['client', 'courier', 'manager'] as const) {
    expect(getExplanation({ kind: 'reset', firstName: 'Иван', role })).toBe(
      'Иван, администратор сбросил ваш пароль. Придумайте новый пароль для входа.',
    );
  }
});
