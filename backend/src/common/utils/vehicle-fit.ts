import { VEHICLE_LIMITS } from '@/common/constants/vehicles.constants';
import type { PackageSpec } from '@/common/schemas/package-spec.schema';
import { VEHICLE_TYPE_VALUES } from '@/common/enums/vehicle-type.enum';
import type { VehicleType } from '@/common/enums/vehicle-type.enum';

export function canVehicleCarry(type: VehicleType, spec: PackageSpec): boolean {
  const limit = VEHICLE_LIMITS[type];
  const sides = [spec.lengthCm, spec.widthCm, spec.heightCm].sort(
    (first, second) => second - first,
  );

  const fitsSides = sides.every((side, index) => side <= (limit.maxSidesCm[index] ?? 0));
  const fitsWeight = spec.weightKg <= limit.maxWeightKg;
  const fitsFragile = !spec.isFragile || limit.allowsFragile;

  return fitsSides && fitsWeight && fitsFragile;
}

// Returns null when even the biggest transport cannot take the package.
export function findLightestVehicle(spec: PackageSpec): VehicleType | null {
  return VEHICLE_TYPE_VALUES.find((type) => canVehicleCarry(type, spec)) ?? null;
}
