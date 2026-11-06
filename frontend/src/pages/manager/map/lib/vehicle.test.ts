import { expect, test } from '@playwright/test';
import { toggleVehicleType, vehicleLabel } from './vehicle';

test('should add a transport in the order from the lightest to the heaviest', () => {
  expect(toggleVehicleType(['truck'], 'foot')).toEqual(['foot', 'truck']);
  expect(toggleVehicleType([], 'car')).toEqual(['car']);
});

test('should take a chosen transport away and leave every transport with none chosen', () => {
  expect(toggleVehicleType(['foot', 'car'], 'foot')).toEqual(['car']);
  expect(toggleVehicleType(['car'], 'car')).toEqual([]);
});

test('should name the transport for the staff', () => {
  expect(vehicleLabel('foot')).toBe('Пеший');
  expect(vehicleLabel('car')).toBe('Легковой');
});
