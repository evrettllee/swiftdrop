import { MS_PER_SECOND } from '@/common/constants/time.constants';
import {
  UNSUITABLE_REASON,
  type UnsuitableReason,
} from '../constants/manager-assignment.constants';
import type {
  CourierCandidateRow,
  CourierCandidateView,
  CourierChecks,
  UnsuitableCourierView,
} from '../types/manager-assignment.types';

export function unsuitableReasons(checks: CourierChecks): UnsuitableReason[] {
  const reasons: UnsuitableReason[] = [];

  if (!checks.onShift) {
    reasons.push(UNSUITABLE_REASON.OFFLINE);
  }

  if (!checks.freshLocation) {
    reasons.push(UNSUITABLE_REASON.STALE_LOCATION);
  }

  if (!checks.free) {
    reasons.push(UNSUITABLE_REASON.BUSY);
  }

  if (!checks.hasVehicle) {
    reasons.push(UNSUITABLE_REASON.NO_VEHICLE);
  } else if (!checks.vehicleFits) {
    reasons.push(UNSUITABLE_REASON.VEHICLE_MISMATCH);
  }

  return reasons;
}

export function toCandidateView(row: CourierCandidateRow): CourierCandidateView {
  return {
    courierId: row.courierId,
    name: `${row.firstName} ${row.lastName}`,
    vehicleType: row.vehicleType,
    pickupDistanceM: row.pickupDistanceM,
    positionAgeSec:
      row.positionAgeMs === null ? null : Math.floor(row.positionAgeMs / MS_PER_SECOND),
    hasOpenOffer: row.hasOpenOffer,
  };
}

export function toUnsuitableView(row: CourierCandidateRow): UnsuitableCourierView {
  return { ...toCandidateView(row), reasons: unsuitableReasons(row) };
}
