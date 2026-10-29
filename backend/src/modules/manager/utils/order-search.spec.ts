import { parseOrderSearch } from './order-search';

describe('parseOrderSearch', () => {
  it('should read a short number as an order id only', () => {
    expect(parseOrderSearch('42')).toEqual({ kind: 'number', orderId: 42, phone: null });
  });

  it.each([
    ['+375 29 123-45-67', '+375291234567'],
    ['375291234567', '+375291234567'],
    ['+375 (29) 123 45 67', '+375291234567'],
  ])('should normalise %j to the stored phone %s', (query, phone) => {
    expect(parseOrderSearch(query)).toEqual({ kind: 'number', orderId: null, phone });
  });

  it('should try both an order id and a phone for ten digits that fit the id column', () => {
    expect(parseOrderSearch('2012345678')).toEqual({
      kind: 'number',
      orderId: 2_012_345_678,
      phone: '+2012345678',
    });
  });

  it.each(['0', '1234567890123456'])('should find nothing by %j', (query) => {
    expect(parseOrderSearch(query)).toEqual({ kind: 'number', orderId: null, phone: null });
  });

  it.each([
    ['Анна', '%Анна%'],
    ['anna@example.com', '%anna@example.com%'],
    ['100%_off\\', '%100\\%\\_off\\\\%'],
    ['Заказ 42', '%Заказ 42%'],
    ['+-', '%+-%'],
  ])('should search the text %j as %j', (query, pattern) => {
    expect(parseOrderSearch(query)).toEqual({ kind: 'text', pattern });
  });
});
