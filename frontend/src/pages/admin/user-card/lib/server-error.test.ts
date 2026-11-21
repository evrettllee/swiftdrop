import { expect, test } from '@playwright/test';
import { ApiError } from '@/shared/api';
import { actionErrorOf, splitMessage } from './server-error';

test('should make the first sentence of the server text the title', () => {
  expect(splitMessage('Есть активный заказ. Сменить роль можно после его завершения')).toEqual({
    title: 'Есть активный заказ',
    text: 'Сменить роль можно после его завершения.',
  });
  expect(splitMessage('Пользователь уже заблокирован')).toEqual({
    title: 'Пользователь уже заблокирован',
    text: null,
  });
});

test('should lock the action only after a conflict', () => {
  expect(actionErrorOf(new ApiError(409, 'Пользователь уже удалён'), 'Ошибка')).toEqual({
    title: 'Пользователь уже удалён',
    text: null,
    isConflict: true,
  });
  expect(actionErrorOf(new ApiError(429, 'Слишком много сбросов пароля. Подождите минуту'), 'Ошибка')).toEqual({
    title: 'Слишком много сбросов пароля',
    text: 'Подождите минуту.',
    isConflict: false,
  });
  expect(actionErrorOf(new Error('network'), 'Не удалось выполнить действие')).toMatchObject({
    title: 'Не удалось выполнить действие',
    isConflict: false,
  });
});
