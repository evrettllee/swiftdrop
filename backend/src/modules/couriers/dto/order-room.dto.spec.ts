import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { orderRoomBodySchema } from './order-room.dto';

describe('orderRoomBodySchema', () => {
  it('should accept a positive integer order id', () => {
    expect(orderRoomBodySchema.safeParse({ orderId: 1 }).success).toBe(true);
    expect(orderRoomBodySchema.safeParse({ orderId: DB_INTEGER_MAX }).success).toBe(true);
  });

  it.each([
    ['a string id', { orderId: '1' }],
    ['zero', { orderId: 0 }],
    ['a negative id', { orderId: -1 }],
    ['a fraction', { orderId: 1.5 }],
    ['an id beyond the integer column', { orderId: DB_INTEGER_MAX + 1 }],
    ['an extra field', { orderId: 1, userId: 2 }],
    ['no id', {}],
    ['not an object', 1],
    ['null', null],
  ])('should reject %s', (_, body) => {
    expect(orderRoomBodySchema.safeParse(body).success).toBe(false);
  });
});
