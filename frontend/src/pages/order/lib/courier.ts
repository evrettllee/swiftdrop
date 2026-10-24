import { formatVehicleDetails, VEHICLE_TYPE_META } from '@/entities/courier';
import type { CourierVehicle } from '@/shared/api';
import { ORDER_COURIER_TEXTS } from '../config/tracking';

// "Легковой, Skoda Octavia, 1234 AB-7"; a transport without a brand or a plate is only its type.
export function formatCourierVehicle(vehicle: CourierVehicle): string {
  return [VEHICLE_TYPE_META[vehicle.type].label, formatVehicleDetails(vehicle) ?? '']
    .filter((part) => part !== '')
    .join(ORDER_COURIER_TEXTS.VEHICLE_SEPARATOR);
}

export function formatCourierVehicleShort(vehicle: CourierVehicle): string {
  return [VEHICLE_TYPE_META[vehicle.type].label, vehicle.licensePlate ?? '']
    .filter((part) => part !== '')
    .join(ORDER_COURIER_TEXTS.VEHICLE_SEPARATOR);
}
