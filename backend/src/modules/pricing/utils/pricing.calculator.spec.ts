import type { PackageSpec } from '@/common/schemas/package-spec.schema';
import { calculatePrice } from './pricing.calculator';
import type { PriceInput, TariffRates } from '../types/pricing.types';

const RATES: TariffRates = { pricePerKm: 1, pricePerKg: 0.5, minPrice: 5, fragileFee: 2 };

const LIGHT_PACKAGE: PackageSpec = {
  weightKg: 2.5,
  lengthCm: 30,
  widthCm: 20,
  heightCm: 10,
  isFragile: false,
};

function buildInput(overrides: Partial<PriceInput> = {}): PriceInput {
  return {
    distanceKm: 7.98,
    spec: LIGHT_PACKAGE,
    vehicleType: 'foot',
    rates: RATES,
    coefficient: 1,
    ...overrides,
  };
}

describe('calculatePrice', () => {
  it('should add distance and weight charges when no extras apply', () => {
    expect(calculatePrice(buildInput())).toBe(9.23);
  });

  it('should return the minimum price when the sum is lower', () => {
    expect(
      calculatePrice(buildInput({ distanceKm: 1, spec: { ...LIGHT_PACKAGE, weightKg: 0.1 } })),
    ).toBe(5);
  });

  it('should add the fragile fee only for a fragile package', () => {
    expect(calculatePrice(buildInput({ spec: { ...LIGHT_PACKAGE, isFragile: true } }))).toBe(11.23);
  });

  it('should apply the class multiplier of the transport', () => {
    const input = buildInput({ distanceKm: 10, spec: { ...LIGHT_PACKAGE, weightKg: 5 } });

    expect(calculatePrice({ ...input, vehicleType: 'foot' })).toBe(12.5);
    expect(calculatePrice({ ...input, vehicleType: 'car' })).toBe(16.25);
  });

  it('should apply the coefficient after the minimum price', () => {
    expect(
      calculatePrice(
        buildInput({
          distanceKm: 1,
          spec: { ...LIGHT_PACKAGE, weightKg: 0.1 },
          coefficient: 1.2,
        }),
      ),
    ).toBe(6);
  });

  it('should cap the coefficient at 2.0', () => {
    expect(calculatePrice(buildInput({ coefficient: 5 }))).toBe(18.46);
  });

  it('should never use a coefficient below 1.0', () => {
    expect(calculatePrice(buildInput({ coefficient: 0.5 }))).toBe(9.23);
  });

  it('should round half a cent up despite float noise', () => {
    expect(
      calculatePrice(buildInput({ distanceKm: 9.225, spec: { ...LIGHT_PACKAGE, weightKg: 0 } })),
    ).toBe(9.23);
  });
});
