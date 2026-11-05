import { expect, test } from '@playwright/test';
import {
  ASSIGNMENT_EVENT,
  type AssignmentPlace,
  decideAssignment,
  missedAssignment,
} from './assignment';

const ORDER_ID = 48232;
const OTHER_ORDER_ID = 48219;

const ON_LINE: AssignmentPlace = { activeOrderId: null, isOnWorkPage: true, hasOpenOffer: false };

test('should show a new assigned order on the work page with a signal and no link', () => {
  expect(decideAssignment(ASSIGNMENT_EVENT.ASSIGNED, ORDER_ID, ON_LINE)).toEqual({
    dropActiveOrder: false,
    closeOffer: false,
    toast: { event: ASSIGNMENT_EVENT.ASSIGNED, hasOpenLink: false },
    signal: true,
  });
});

test('should link to the work page from another page and close an open offer', () => {
  const decision = decideAssignment(ASSIGNMENT_EVENT.ASSIGNED, ORDER_ID, {
    ...ON_LINE,
    isOnWorkPage: false,
    hasOpenOffer: true,
  });

  expect(decision.toast).toEqual({ event: ASSIGNMENT_EVENT.ASSIGNED, hasOpenLink: true });
  expect(decision.closeOffer).toBe(true);
});

test('should not announce again the order the courier already carries', () => {
  const decision = decideAssignment(ASSIGNMENT_EVENT.ASSIGNED, ORDER_ID, {
    ...ON_LINE,
    activeOrderId: ORDER_ID,
  });

  expect(decision.toast).toBeNull();
  expect(decision.signal).toBe(false);
});

test('should drop the current order and tell that it went to another courier', () => {
  expect(
    decideAssignment(ASSIGNMENT_EVENT.UNASSIGNED, ORDER_ID, {
      ...ON_LINE,
      activeOrderId: ORDER_ID,
      isOnWorkPage: false,
    }),
  ).toEqual({
    dropActiveOrder: true,
    closeOffer: false,
    toast: { event: ASSIGNMENT_EVENT.UNASSIGNED, hasOpenLink: false },
    signal: false,
  });
});

test('should keep the current order when another one is taken away', () => {
  const decision = decideAssignment(ASSIGNMENT_EVENT.UNASSIGNED, OTHER_ORDER_ID, {
    ...ON_LINE,
    activeOrderId: ORDER_ID,
  });

  expect(decision.dropActiveOrder).toBe(false);
  expect(decision.toast).toBeNull();
});

test('should find the order assigned or taken away while the connection was lost', () => {
  expect(missedAssignment(null, ORDER_ID)).toEqual({
    event: ASSIGNMENT_EVENT.ASSIGNED,
    orderId: ORDER_ID,
  });
  expect(missedAssignment(ORDER_ID, null)).toEqual({
    event: ASSIGNMENT_EVENT.UNASSIGNED,
    orderId: ORDER_ID,
  });
  expect(missedAssignment(OTHER_ORDER_ID, ORDER_ID)).toEqual({
    event: ASSIGNMENT_EVENT.ASSIGNED,
    orderId: ORDER_ID,
  });
  expect(missedAssignment(ORDER_ID, ORDER_ID)).toBeNull();
  expect(missedAssignment(null, null)).toBeNull();
});
