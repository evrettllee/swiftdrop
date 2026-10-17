import { COURIERS_API_PATHS, type CourierVehicle, courierVehicleSchema, http } from '@/shared/api';
import type { VehicleInput } from '../model/vehicle-form';

export async function updateVehicle(input: VehicleInput): Promise<CourierVehicle> {
  return courierVehicleSchema.parse(await http.put(COURIERS_API_PATHS.VEHICLE, input));
}
