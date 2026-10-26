import type { PackageSpec } from '@/common/schemas/package-spec.schema';
import { canVehicleCarry, findLightestVehicle } from './vehicle-fit';

function buildPackage(overrides: Partial<PackageSpec> = {}): PackageSpec {
  return {
    weightKg: 1,
    lengthCm: 20,
    widthCm: 20,
    heightCm: 10,
    isFragile: false,
    ...overrides,
  };
}

describe('findLightestVehicle', () => {
  it('should return foot when a small light package is given', () => {
    expect(findLightestVehicle(buildPackage())).toBe('foot');
  });

  it('should accept the weight limit exactly', () => {
    expect(findLightestVehicle(buildPackage({ weightKg: 3 }))).toBe('foot');
  });

  it('should return bicycle when the weight is over the foot limit', () => {
    expect(findLightestVehicle(buildPackage({ weightKg: 4 }))).toBe('bicycle');
  });

  it('should compare sorted sides regardless of which side is called length', () => {
    expect(findLightestVehicle(buildPackage({ lengthCm: 10, widthCm: 40, heightCm: 20 }))).toBe(
      'foot',
    );
  });

  it('should skip the bicycle when the package is fragile', () => {
    expect(findLightestVehicle(buildPackage({ weightKg: 4, isFragile: true }))).toBe('scooter');
  });

  it('should return car for a package of 25 kg', () => {
    expect(findLightestVehicle(buildPackage({ weightKg: 25 }))).toBe('car');
  });

  it('should return truck for a package of 100 kg', () => {
    expect(
      findLightestVehicle(buildPackage({ weightKg: 100, lengthCm: 50, widthCm: 40, heightCm: 30 })),
    ).toBe('truck');
  });

  it('should return null when the package is heavier than any transport can carry', () => {
    expect(findLightestVehicle(buildPackage({ weightKg: 600 }))).toBeNull();
  });

  it('should return null when a side is longer than any transport can carry', () => {
    expect(findLightestVehicle(buildPackage({ lengthCm: 250 }))).toBeNull();
  });
});

describe('canVehicleCarry', () => {
  it('should be false when a fragile package is given to a bicycle', () => {
    expect(canVehicleCarry('bicycle', buildPackage({ isFragile: true }))).toBe(false);
  });

  it('should be true when a truck gets a package within its limits', () => {
    expect(canVehicleCarry('truck', buildPackage({ weightKg: 400 }))).toBe(true);
  });
});
