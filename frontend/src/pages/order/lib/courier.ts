import { formatVehicleDetails, VEHICLE_TYPE_META } from '@/entities/courier';
import type { CourierVehicle } from '@/shared/api';
import { ORDER_COURIER_TEXTS } from '../config/tracking';

// "Легковой, Skoda Octavia, 1234 AB-7"; a transport without a brand or a plate is only its type.
export function formatCourierVehicle(vehicle: CourierVehicle): string {
  return [VEHICLE_TYPE_META[vehicle.type].label, formatVehicleDetails(vehicle) ?? '']
    .filter((part) => part !== '')
    .join(ORDER_COURIER_TEXTS.VEHICLE_SEPARATOR);
}

// The first letters of the first two words: "Дмитрий С." is "ДС".
export function getCourierInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => word !== '')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}
