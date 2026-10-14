import type { VehicleType } from '../../../common/enums/vehicle-type.enum';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import type { PackageSpec } from '../../../common/schemas/package-spec.schema';

// What assignment needs to know about an order.
export type DispatchOrder = {
  orderId: number;
  pickup: GeoPoint;
  delivery: GeoPoint;
  parcel: PackageSpec;
};

// A courier who may get the order, with the straight-line distance to the pickup point.
export type CourierCandidate = {
  courierProfileId: number;
  vehicleType: VehicleType;
  position: GeoPoint;
  distanceKm: number;
};
