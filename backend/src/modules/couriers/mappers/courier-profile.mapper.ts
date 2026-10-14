import type { CourierMe, CourierProfileRow, CourierVehicle } from '../types/couriers.types';

export function toCourierVehicle(vehicle: CourierVehicle): CourierVehicle {
  return {
    type: vehicle.type,
    brand: vehicle.brand,
    model: vehicle.model,
    licensePlate: vehicle.licensePlate,
  };
}

export function toCourierMe(row: CourierProfileRow, activeOrderId: number | null): CourierMe {
  const vehicle =
    row.vehicleType === null
      ? null
      : toCourierVehicle({
          type: row.vehicleType,
          brand: row.brand,
          model: row.model,
          licensePlate: row.licensePlate,
        });

  return { isAvailable: row.isAvailable, vehicle, activeOrderId };
}
