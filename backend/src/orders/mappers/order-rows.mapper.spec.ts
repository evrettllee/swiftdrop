import { toAddressRow, toPackageRow } from './order-rows.mapper';

describe('order rows mapper', () => {
  const address = {
    latitude: 53.9,
    longitude: 27.56,
    city: 'Минск',
    street: 'ул. Свердлова',
    house: '13а',
  };

  it('should set apartment to null when the address has none', () => {
    expect(toAddressRow(address).apartment).toBeNull();
  });

  it('should keep the apartment when the address has one', () => {
    expect(toAddressRow({ ...address, apartment: '47' }).apartment).toBe('47');
  });

  it('should map the package spec to table columns when building a package row', () => {
    const spec = { weightKg: 2.5, lengthCm: 40, widthCm: 30, heightCm: 20, isFragile: true };

    expect(toPackageRow(7, spec)).toEqual({
      orderId: 7,
      weight: 2.5,
      length: 40,
      width: 30,
      height: 20,
      isFragile: true,
    });
  });
});
