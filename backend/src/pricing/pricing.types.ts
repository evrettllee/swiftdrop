import type { PackageSpec } from '../common/common.types';
import type { VehicleType } from '../common/enums/vehicle-type.enum';

export type TariffRates = {
  pricePerKm: number;
  pricePerKg: number;
  minPrice: number;
  fragileFee: number;
};

export type PriceInput = {
  distanceKm: number;
  spec: PackageSpec;
  // The lightest transport that can carry the package, it defines the class multiplier.
  vehicleType: VehicleType;
  rates: TariffRates;
  coefficient: number;
};

export type PriceEstimate = {
  price: number;
  currency: string;
  distanceKm: number;
  estimatedMinutes: number;
  coefficient: number;
};
