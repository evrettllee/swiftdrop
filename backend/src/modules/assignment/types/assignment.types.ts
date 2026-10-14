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

// A candidate with the time the route to the pickup point takes.
export type CandidatePickup = {
  candidate: CourierCandidate;
  etaSec: number;
};

// The courier chosen for an offer and the times shown in it.
export type OfferPlan = {
  courierProfileId: number;
  pickupEtaSec: number;
  // From now to the delivery: the way to the pickup point and then to the recipient.
  totalEtaSec: number;
};

type OfferPickup = GeoPoint & {
  city: string;
  street: string;
  house: string;
  apartment: string | null;
};

// The delivery before accepting: the street and the area, never the house.
type OfferDeliveryArea = GeoPoint & {
  city: string;
  street: string;
};

// An offer as the database query returns it.
export type CourierOfferRow = {
  offerId: number;
  orderId: number;
  expiresAt: Date;
  pickupEtaSec: number;
  totalEtaSec: number;
  pickup: OfferPickup;
  delivery: OfferDeliveryArea;
  parcel: PackageSpec;
};

// An offer as the courier sees it.
export type CourierOffer = Omit<CourierOfferRow, 'expiresAt'> & { expiresAt: string };

export type CurrentOffer = { offer: CourierOffer | null };
