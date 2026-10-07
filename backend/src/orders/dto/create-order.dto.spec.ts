import { PACKAGE_VALIDATION_MESSAGES } from '../../common/constants/package.constants';
import { PHONE_INVALID_MESSAGE } from '../../common/constants/person-validation.constants';
import { ORDERS_VALIDATION_MESSAGES } from '../orders.constants';
import { createOrderSchema } from './create-order.dto';

const pickup = {
  latitude: 53.9,
  longitude: 27.56,
  city: 'Минск',
  street: 'Свердлова',
  house: '13а',
};

const validOrder = {
  pickup,
  delivery: { ...pickup, street: 'Притыцкого', house: '83', apartment: '47' },
  recipient: { name: 'Ирина Козлова', phone: '+375 29 123-45-67' },
  package: { weightKg: 2.5, lengthCm: 40, widthCm: 30, heightCm: 20, isFragile: true },
};

function messagesOf(input: unknown): string[] {
  const result = createOrderSchema.safeParse(input);

  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('createOrderSchema', () => {
  it('should accept the order and normalize the phone when the data is valid', () => {
    const order = createOrderSchema.parse(validOrder);

    expect(order.recipient.phone).toBe('+375291234567');
    expect(order.delivery.apartment).toBe('47');
  });

  it('should drop the apartment when it is empty', () => {
    const order = createOrderSchema.parse({
      ...validOrder,
      delivery: { ...validOrder.delivery, apartment: '  ' },
    });

    expect(order.delivery.apartment).toBeUndefined();
  });

  it('should return the house message when the house is missing', () => {
    const messages = messagesOf({ ...validOrder, pickup: { ...pickup, house: '' } });

    expect(messages).toEqual([ORDERS_VALIDATION_MESSAGES.HOUSE_REQUIRED]);
  });

  it('should return the phone message when the phone is not international', () => {
    const messages = messagesOf({
      ...validOrder,
      recipient: { ...validOrder.recipient, phone: '80291234567' },
    });

    expect(messages).toEqual([PHONE_INVALID_MESSAGE]);
  });

  it('should return the package message when the weight is zero', () => {
    const messages = messagesOf({ ...validOrder, package: { ...validOrder.package, weightKg: 0 } });

    expect(messages).toEqual([PACKAGE_VALIDATION_MESSAGES.PACKAGE_VALUE_INVALID]);
  });
});
