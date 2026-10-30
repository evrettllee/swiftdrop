import type { VehicleType } from '@/common/enums/vehicle-type.enum';
import type { UnsuitableReason } from '../constants/manager-assignment.constants';

export type CourierCandidateView = {
  courierId: number;
  name: string;
  vehicleType: VehicleType | null;
  pickupDistanceM: number | null;
  positionAgeSec: number | null;
  hasOpenOffer: boolean;
};

export type UnsuitableCourierView = CourierCandidateView & {
  reasons: UnsuitableReason[];
};

export type CourierCandidates = {
  suitable: CourierCandidateView[];
  unsuitable: UnsuitableCourierView[];
};

export type CourierChecks = {
  onShift: boolean;
  freshLocation: boolean;
  free: boolean;
  hasVehicle: boolean;
  vehicleFits: boolean;
};

export type CourierCandidateRow = CourierChecks & {
  courierId: number;
  firstName: string;
  lastName: string;
  vehicleType: VehicleType | null;
  pickupDistanceM: number | null;
  positionAgeMs: number | null;
  hasOpenOffer: boolean;
};

export type AssignedOrder = {
  orderId: number;
  courierId: number;
};
