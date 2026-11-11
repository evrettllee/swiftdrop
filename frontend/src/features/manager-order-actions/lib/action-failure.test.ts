import { expect, test } from '@playwright/test';
import { ApiError } from '@/shared/api';
import { toActionFailure } from './action-failure';

function conflict(body: object): ApiError {
  return new ApiError(409, 'conflict', [], { statusCode: 409, message: 'conflict', ...body });
}

test('should ask to refresh when the order or its courier has changed', () => {
  for (const code of [
    'ORDER_NOT_ASSIGNABLE',
    'ORDER_NOT_REASSIGNABLE',
    'ORDER_NOT_RESTARTABLE',
    'ORDER_NOT_CANCELLABLE',
    'COURIER_CHANGED',
  ]) {
    expect(toActionFailure(conflict({ code }))).toMatchObject({
      kind: 'stale',
      title: 'Заказ уже изменился',
    });
  }
});

test('should name why the courier cannot take the order and keep the window open', () => {
  expect(toActionFailure(conflict({ code: 'COURIER_NOT_AVAILABLE', reason: 'busy' }))).toEqual({
    kind: 'conflict',
    title: 'Курьер не может взять заказ',
    text: 'Везёт другой заказ',
  });
  expect(toActionFailure(conflict({ code: 'SAME_COURIER' }))).toMatchObject({
    kind: 'conflict',
    title: 'Этот курьер уже назначен на заказ',
  });
  expect(toActionFailure(conflict({}))).toMatchObject({
    kind: 'conflict',
    title: 'Заказ или курьер сейчас обновляются',
  });
});

test('should show the error of the field, and offer to retry after a network failure', () => {
  const invalid = new ApiError(400, 'Ошибка', [
    { field: 'reason', message: 'Причина: от 1 до 500 символов' },
  ]);

  expect(toActionFailure(invalid)).toMatchObject({
    kind: 'field',
    title: 'Причина: от 1 до 500 символов',
  });
  expect(toActionFailure(new ApiError(0, 'network'))).toMatchObject({ kind: 'retry' });
  expect(toActionFailure(new ApiError(503, 'down'))).toMatchObject({ kind: 'retry' });
  expect(toActionFailure(new ApiError(404, 'missing'))).toMatchObject({
    kind: 'stale',
    title: 'Заказ или курьер не найден',
  });
});
