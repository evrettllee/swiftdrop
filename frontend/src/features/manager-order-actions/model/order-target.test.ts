import { expect, test } from '@playwright/test';
import { ORDER_STATUS } from '@/shared/api';
import { expectedCourierId, hasAssignedCourier, type StaffOrderTarget } from './order-target';

const WAITING: StaffOrderTarget = {
  orderId: 48231,
  status: ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
  courier: null,
  price: 12.3,
  paymentState: 'paid',
  parcelWeightKg: 2.5,
};

test('should expect the courier of the loaded order, or none', () => {
  const assigned = {
    ...WAITING,
    status: ORDER_STATUS.COURIER_ASSIGNED,
    courier: { id: 12, name: 'Андрей Король' },
  };

  expect(expectedCourierId(WAITING)).toBeNull();
  expect(expectedCourierId(assigned)).toBe(12);
  expect(hasAssignedCourier(WAITING)).toBe(false);
  expect(hasAssignedCourier(assigned)).toBe(true);
});
