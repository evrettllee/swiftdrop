import { VEHICLE_TYPE_VALUES, type VehicleType } from '@/common/enums/vehicle-type.enum';
import type { PackageSpec } from '@/common/schemas/package-spec.schema';
import { canVehicleCarry } from '@/common/utils/vehicle-fit';

// Every vehicle that can take the package, from the lightest to the heaviest.
export function vehiclesThatCarry(spec: PackageSpec): VehicleType[] {
  return VEHICLE_TYPE_VALUES.filter((type) => canVehicleCarry(type, spec));
}
