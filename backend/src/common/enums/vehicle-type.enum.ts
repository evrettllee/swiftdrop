// Ordered from the lightest to the heaviest transport: the order is used to pick the lightest one that fits.
export const VEHICLE_TYPE_VALUES = ['foot', 'bicycle', 'scooter', 'car', 'truck'] as const;

export type VehicleType = (typeof VEHICLE_TYPE_VALUES)[number];

export const VEHICLE_TYPE = {
  FOOT: 'foot',
  BICYCLE: 'bicycle',
  SCOOTER: 'scooter',
  CAR: 'car',
  TRUCK: 'truck',
} as const satisfies Record<string, VehicleType>;
