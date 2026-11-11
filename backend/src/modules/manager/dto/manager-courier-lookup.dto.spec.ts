import { courierLookupSchema } from './manager-courier-lookup.dto';

describe('courierLookupSchema', () => {
  it('should take ten couriers without a search by default', () => {
    expect(courierLookupSchema.parse({})).toEqual({ search: null, limit: 10 });
  });

  it('should take a limit from 1 to 20 only', () => {
    expect(courierLookupSchema.parse({ limit: '20' }).limit).toBe(20);
    expect(courierLookupSchema.safeParse({ limit: '0' }).success).toBe(false);
    expect(courierLookupSchema.safeParse({ limit: '21' }).success).toBe(false);
    expect(courierLookupSchema.safeParse({ limit: '2.5' }).success).toBe(false);
  });

  it('should parse the search as the order list does', () => {
    expect(courierLookupSchema.parse({ q: ' Сок ' }).search).toEqual({
      kind: 'text',
      pattern: '%Сок%',
    });
    expect(courierLookupSchema.parse({ q: '29 111-22-33' }).search).toEqual({
      kind: 'number',
      orderId: 291112233,
      phone: '+375291112233',
    });
  });

  it('should refuse a short text search and an unknown parameter', () => {
    expect(courierLookupSchema.safeParse({ q: 'Со' }).success).toBe(false);
    expect(courierLookupSchema.safeParse({ state: 'free' }).success).toBe(false);
  });
});
