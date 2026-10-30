import { STAFF_ORDER_EVENT_KIND_VALUES } from '../constants/socket-events.constants';
import { staffOrderEventSchema } from './staff-order-event.dto';

const EVENT = {
  orderId: 42,
  kind: 'status',
  status: 'courier_assigned',
  statusChangedAt: '2026-10-30T09:00:00.000Z',
  courierId: 3,
};

describe('staffOrderEventSchema', () => {
  it.each(STAFF_ORDER_EVENT_KIND_VALUES)('should take the kind %s', (kind) => {
    expect(staffOrderEventSchema.safeParse({ ...EVENT, kind }).success).toBe(true);
  });

  it('should take an order with no courier', () => {
    expect(staffOrderEventSchema.safeParse({ ...EVENT, courierId: null }).success).toBe(true);
  });

  it.each([
    ['an unknown kind', { ...EVENT, kind: 'deleted' }],
    ['an unknown status', { ...EVENT, status: 'lost' }],
    ['a time that is no ISO string', { ...EVENT, statusChangedAt: 'yesterday' }],
    ['a personal field', { ...EVENT, clientName: 'Иван Петров' }],
    [
      'a missing courier',
      { orderId: 42, kind: 'created', status: 'pending', statusChangedAt: EVENT.statusChangedAt },
    ],
  ])('should refuse %s', (_, payload) => {
    expect(staffOrderEventSchema.safeParse(payload).success).toBe(false);
  });
});
