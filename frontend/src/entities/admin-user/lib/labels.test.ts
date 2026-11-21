import { expect, test } from '@playwright/test';
import { STATUS_TONE, statusView, vehicleView } from './labels';

test('should name every status and give it its colour', () => {
  expect(statusView('active')).toEqual({ label: 'Активен', tone: STATUS_TONE.OK });
  expect(statusView('blocked')).toEqual({ label: 'Заблокирован', tone: STATUS_TONE.ERROR });
  expect(statusView('invited')).toEqual({ label: 'Приглашён', tone: STATUS_TONE.MUTED });
  expect(statusView('deleted')).toEqual({ label: 'Удалён', tone: STATUS_TONE.MUTED });
});

test('should name the vehicles as the staff sees them', () => {
  expect(vehicleView('foot').label).toBe('Пеший');
  expect(vehicleView('car').label).toBe('Легковой');
  expect(vehicleView('truck').label).toBe('Грузовой');
});

test('should show a courier without a vehicle as not given', () => {
  expect(vehicleView(null)).toMatchObject({ label: 'Не указан', isMissing: true });
  expect(vehicleView(undefined).isMissing).toBe(true);
  expect(vehicleView('bicycle').isMissing).toBe(false);
});
