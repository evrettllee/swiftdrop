import { expect, test } from '@playwright/test';
import { ApiError } from '@/shared/api';
import { fieldErrorsOf, offError } from './server-errors';

test('should put the field errors of a 400 under their fields', () => {
  const error = new ApiError(400, 'Bad', [
    { field: 'minPrice', message: 'Введите число больше 0' },
    { field: 'name', message: 'Название от 2 до 50 символов' },
    { field: 'unknown', message: 'Лишнее' },
  ]);

  expect(fieldErrorsOf(error)).toEqual({
    minPrice: 'Введите число больше 0',
    name: 'Название от 2 до 50 символов',
  });
});

test('should put a taken name under the name', () => {
  expect(fieldErrorsOf(new ApiError(409, 'Тариф с таким названием уже есть'))).toEqual({
    name: 'Тариф с таким названием уже есть',
  });
});

test('should leave other errors to the toast', () => {
  expect(fieldErrorsOf(new ApiError(404, 'Тариф не найден'))).toBeNull();
  expect(
    fieldErrorsOf(new ApiError(409, 'Тариф сейчас изменяется. Попробуйте ещё раз')),
  ).toBeNull();
  expect(fieldErrorsOf(new Error('network'))).toBeNull();
});

test('should split the refusal to switch off into a title and what is wrong', () => {
  expect(
    offError(new ApiError(409, 'Тариф нельзя выключить: он используется в зоне «Боровляны»')),
  ).toEqual({ title: 'Тариф нельзя выключить', text: 'Он используется в зоне «Боровляны»' });
  expect(offError(new ApiError(404, 'Тариф не найден'))).toEqual({
    title: 'Тариф не найден',
    text: '',
  });
  expect(offError(new Error('x'))).toEqual({
    title: 'Не удалось изменить тариф',
    text: 'Проверьте соединение и попробуйте ещё раз',
  });
});
