import type { CourierVehicle } from '@/shared/api';
import { VEHICLE_DETAILS_SEPARATOR, VEHICLE_NAME_SEPARATOR } from '../config/texts';

// "Skoda Octavia, 1234 AB-7" for a car or a truck; null for a transport without registration.
export function formatVehicleDetails(vehicle: CourierVehicle): string | null {
  const name = [vehicle.brand, vehicle.model]
    .filter((part) => part !== null)
    .join(VEHICLE_NAME_SEPARATOR);
  const parts = [name, vehicle.licensePlate ?? ''].filter((part) => part !== '');

  return parts.length === 0 ? null : parts.join(VEHICLE_DETAILS_SEPARATOR);
}
