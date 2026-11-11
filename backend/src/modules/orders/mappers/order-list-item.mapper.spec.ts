import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import type { OrderListRow } from '../types/orders.types';
import { toOrderListItem } from './order-list-item.mapper';

const address = { city: 'Минск', street: 'ул. Свердлова', house: '13а', apartment: null };

function row(status: OrderStatus, patch: Partial<OrderListRow> = {}): OrderListRow {
  return {
    orderId: 48232,
    status,
    price: '11.08',
    createdAt: new Date('2026-10-26T11:52:00.000Z'),
    estimatedDeliveryAt: null,
    pickup: address,
    delivery: address,
    courierFirstName: 'Дмитрий',
    courierLastName: 'Соколов',
    ...patch,
  };
}

describe('toOrderListItem', () => {
  it('should give the price as a number in the currency of the service', () => {
    expect(toOrderListItem(row(ORDER_STATUS.DELIVERED))).toMatchObject({
      price: 11.08,
      currency: 'BYN',
    });
  });

  it.each([ORDER_STATUS.COURIER_ASSIGNED, ORDER_STATUS.IN_TRANSIT, ORDER_STATUS.DELIVERED])(
    'should show only the first name and the initial of the courier when the order is %s',
    (status) => {
      const item = toOrderListItem(row(status));

      expect(item.courier).toEqual({ name: 'Дмитрий С.' });
      expect(JSON.stringify(item)).not.toContain('Соколов');
    },
  );

  it.each([ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED, ORDER_STATUS.CONFIRMED])(
    'should hide the courier when the order is %s',
    (status) => {
      expect(toOrderListItem(row(status)).courier).toBeNull();
    },
  );

  it('should give no courier to an order without one', () => {
    const item = toOrderListItem(
      row(ORDER_STATUS.PENDING, { courierFirstName: null, courierLastName: null }),
    );

    expect(item.courier).toBeNull();
    expect(item).not.toHaveProperty('courierFirstName');
  });
});
