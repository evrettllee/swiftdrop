import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { type ManagerOrderRow, toManagerOrderListItem } from './manager-order.mapper';

const ROW: ManagerOrderRow = {
  orderId: 7,
  createdAt: new Date('2026-10-29T08:00:00.000Z'),
  status: ORDER_STATUS.COURIER_ASSIGNED,
  statusChangedAt: new Date('2026-10-29T08:10:00.000Z'),
  price: '12.50',
  client: { firstName: 'Анна', lastName: 'Ковалёва', phone: '+375291234567' },
  pickup: { street: 'Ленина', house: '1' },
  delivery: { street: 'Сурганова', house: '57Б' },
  courierId: 3,
  courier: { firstName: 'Дмитрий', lastName: 'Соколов' },
  fragile: true,
  paymentState: 'paid',
};

describe('toManagerOrderListItem', () => {
  it('should give the row of the table with full names and the whole phone', () => {
    expect(toManagerOrderListItem(ROW)).toEqual({
      id: 7,
      createdAt: ROW.createdAt,
      status: ORDER_STATUS.COURIER_ASSIGNED,
      statusChangedAt: ROW.statusChangedAt,
      price: 12.5,
      client: { name: 'Анна Ковалёва', phone: '+375291234567' },
      route: { from: { street: 'Ленина', house: '1' }, to: { street: 'Сурганова', house: '57Б' } },
      courier: { id: 3, name: 'Дмитрий Соколов' },
      fragile: true,
      paymentState: 'paid',
    });
  });

  it('should give no courier before one is assigned', () => {
    expect(toManagerOrderListItem({ ...ROW, courierId: null, courier: null }).courier).toBeNull();
  });

  it('should carry no other field of the user', () => {
    expect(Object.keys(toManagerOrderListItem(ROW).client)).toEqual(['name', 'phone']);
  });
});
