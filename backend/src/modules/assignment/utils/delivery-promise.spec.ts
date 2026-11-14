import { promisedDeliveryAt } from './delivery-promise';

const AT = (time: string) => new Date(`2026-11-13T${time}Z`);

describe('promisedDeliveryAt', () => {
  it('should add the route and the pickup allowance and round up to five minutes', () => {
    expect(promisedDeliveryAt(AT('10:02:30'), 22)).toEqual(AT('10:35:00'));
  });

  it('should keep a time that already sits on five minutes', () => {
    expect(promisedDeliveryAt(AT('10:00:00'), 25)).toEqual(AT('10:35:00'));
  });

  it('should move a time one millisecond past five minutes to the next mark', () => {
    expect(promisedDeliveryAt(new Date(AT('10:00:00').getTime() + 1), 25)).toEqual(AT('10:40:00'));
  });

  it('should not count a negative route when the estimate is below the pickup buffer', () => {
    expect(promisedDeliveryAt(AT('10:00:00'), 4)).toEqual(AT('10:20:00'));
  });

  it('should promise nothing for an order without an estimate', () => {
    expect(promisedDeliveryAt(AT('10:00:00'), null)).toBeNull();
  });
});
