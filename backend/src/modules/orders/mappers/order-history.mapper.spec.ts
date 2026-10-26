import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ORDER_CANCELLED_BY } from '../constants/orders.constants';
import { toOrderHistory } from './order-history.mapper';

describe('order history mapper', () => {
  const CLIENT_ID = 7;
  const PLACED = { status: ORDER_STATUS.PENDING, changedAt: new Date(1_000), changedBy: CLIENT_ID };

  function cancelled(changedBy: number | null) {
    return { status: ORDER_STATUS.CANCELLED, changedAt: new Date(2_000), changedBy };
  }

  it('should say the system cancelled the order when the cancellation has no author', () => {
    expect(toOrderHistory([PLACED, cancelled(null)], CLIENT_ID).cancelledBy).toBe(
      ORDER_CANCELLED_BY.SYSTEM,
    );
  });

  it('should say the client cancelled the order when the client wrote the cancellation', () => {
    expect(toOrderHistory([PLACED, cancelled(CLIENT_ID)], CLIENT_ID).cancelledBy).toBe(
      ORDER_CANCELLED_BY.CLIENT,
    );
  });

  it('should say the staff cancelled the order when someone else wrote the cancellation', () => {
    expect(toOrderHistory([PLACED, cancelled(99)], CLIENT_ID).cancelledBy).toBe(
      ORDER_CANCELLED_BY.STAFF,
    );
  });

  it('should give no author when the order is not cancelled', () => {
    expect(toOrderHistory([PLACED], CLIENT_ID).cancelledBy).toBeNull();
  });

  it('should keep only the status and the time in the history entries', () => {
    expect(toOrderHistory([PLACED, cancelled(null)], CLIENT_ID).history).toEqual([
      { status: ORDER_STATUS.PENDING, changedAt: new Date(1_000) },
      { status: ORDER_STATUS.CANCELLED, changedAt: new Date(2_000) },
    ]);
  });
});
