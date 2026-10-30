import { ORDER_STATUS_VALUES, type OrderStatus } from '@/common/enums/order-status.enum';
import { toActions, toActor, toPayment } from './order-detail-rules';

const AT = new Date('2026-10-29T10:00:00.000Z');
const LATER = new Date('2026-10-29T11:00:00.000Z');

describe('toActor', () => {
  it.each([
    [7, 'client', 'client'],
    [9, 'courier', 'courier'],
    [2, 'manager', 'staff'],
    [1, 'admin', 'staff'],
    [null, null, 'system'],
  ] as const)('should read the user %s with the role %s as %s', (changedBy, role, actor) => {
    expect(toActor(changedBy, role)).toBe(actor);
  });
});

describe('toPayment', () => {
  it('should be unpaid without a paid or a refunded attempt', () => {
    expect(toPayment([])).toEqual({ state: 'unpaid', paidAt: null, refundedAt: null });
  });

  it('should be paid with the time of the payment', () => {
    expect(toPayment([{ status: 'paid', paidAt: AT, refundedAt: null }])).toEqual({
      state: 'paid',
      paidAt: AT,
      refundedAt: null,
    });
  });

  it('should be refunded with both times when nothing stays paid', () => {
    expect(toPayment([{ status: 'refunded', paidAt: AT, refundedAt: LATER }])).toEqual({
      state: 'refunded',
      paidAt: AT,
      refundedAt: LATER,
    });
  });

  it('should stay paid when a second payment was refunded', () => {
    const rows = [
      { status: 'paid', paidAt: AT, refundedAt: null },
      { status: 'refunded', paidAt: LATER, refundedAt: LATER },
    ] as const;

    expect(toPayment(rows)).toEqual({ state: 'paid', paidAt: AT, refundedAt: null });
  });
});

describe('toActions', () => {
  const EXPECTED: Record<OrderStatus, [boolean, boolean, boolean, boolean]> = {
    pending: [false, false, false, true],
    confirmed: [true, false, false, true],
    awaiting_manual_assignment: [true, false, true, true],
    courier_assigned: [false, true, false, true],
    picked_up: [false, false, false, false],
    in_transit: [false, false, false, false],
    delivered: [false, false, false, false],
    cancelled: [false, false, false, false],
    rejected: [false, false, false, false],
  };

  it.each(ORDER_STATUS_VALUES)('should allow the actions of the status %s', (status) => {
    const [canAssign, canReassign, canRestartAutoAssign, canCancel] = EXPECTED[status];

    expect(toActions(status)).toEqual({
      canAssign,
      canReassign,
      canRestartAutoAssign,
      canCancel,
    });
  });
});
