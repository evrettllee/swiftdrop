import { packages } from '../../database/schema';

// The package of an order in the shape of PackageSpec.
export function parcelColumns() {
  return {
    weightKg: packages.weight,
    lengthCm: packages.length,
    widthCm: packages.width,
    heightCm: packages.height,
    isFragile: packages.isFragile,
  };
}
