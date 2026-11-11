import { STAFF_VEHICLE_LABELS, VEHICLE_TYPE_ORDER } from '@/entities/courier';
import { formatParcelWeight } from '@/entities/order';
import { PRICE_TEXTS } from '@/entities/price';
import type { VehicleType } from '@/shared/api';
import { APP_LOCALE } from '@/shared/config';
import { formatCount, pluralize } from '@/shared/lib/format';
import type { CourierCandidate, CourierCandidates, UnsuitableCandidate } from '@/shared/staff-api';
import { VEHICLE_FILTER_ALL } from '../config/actions';
import {
  ASSIGN_TEXTS,
  COURIERS_PLURAL,
  REASONS_SEPARATOR,
  UNSUITABLE_REASON_LABELS,
} from '../config/texts';

const METERS_PER_KM = 1000;
const LINE_SEPARATOR = ', ';
const pickupDistanceFormat = new Intl.NumberFormat(APP_LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export type VehicleFilter = VehicleType | typeof VEHICLE_FILTER_ALL;

export type VehicleChip = { value: VehicleFilter; label: string; count: number };

export function vehicleChips(suitable: readonly CourierCandidate[]): VehicleChip[] {
  const counts = new Map<VehicleType, number>();

  for (const { vehicleType } of suitable) {
    if (vehicleType !== null) {
      counts.set(vehicleType, (counts.get(vehicleType) ?? 0) + 1);
    }
  }

  return [
    { value: VEHICLE_FILTER_ALL, label: ASSIGN_TEXTS.ALL, count: suitable.length },
    ...VEHICLE_TYPE_ORDER.filter((type) => counts.has(type)).map((type) => ({
      value: type,
      label: STAFF_VEHICLE_LABELS[type],
      count: counts.get(type) ?? 0,
    })),
  ];
}

export function withoutCourier<T extends CourierCandidate>(
  candidates: readonly T[],
  courierId: number | null,
): T[] {
  return candidates.filter((candidate) => candidate.courierId !== courierId);
}

export type CandidatesView = {
  shown: CourierCandidates | null;
  choosable: CourierCandidate[];
  chips: VehicleChip[];
};

export function candidatesView(
  data: CourierCandidates | null,
  vehicle: VehicleFilter,
  currentId: number | null,
): CandidatesView {
  if (data === null) {
    return { shown: null, choosable: [], chips: [] };
  }

  const shown = filterCandidates(data, vehicle);

  return {
    shown,
    choosable: withoutCourier(shown.suitable, currentId),
    chips: vehicleChips(withoutCourier(data.suitable, currentId)),
  };
}

export function filterByVehicle<T extends CourierCandidate>(
  candidates: readonly T[],
  filter: VehicleFilter,
): T[] {
  return filter === VEHICLE_FILTER_ALL
    ? [...candidates]
    : candidates.filter((candidate) => candidate.vehicleType === filter);
}

export function filterCandidates(
  { suitable, unsuitable }: CourierCandidates,
  filter: VehicleFilter,
): CourierCandidates {
  return {
    suitable: filterByVehicle(suitable, filter),
    unsuitable: filterByVehicle(unsuitable, filter),
  };
}

function vehicleLabel(candidate: CourierCandidate): string | null {
  return candidate.vehicleType === null ? null : STAFF_VEHICLE_LABELS[candidate.vehicleType];
}

export function candidateLine(candidate: CourierCandidate): string {
  let state: string | null = null;

  if (candidate.hasOpenOffer) {
    state = ASSIGN_TEXTS.OPEN_OFFER;
  } else if (candidate.positionAgeSec !== null) {
    state = ASSIGN_TEXTS.positionAge(candidate.positionAgeSec);
  }

  return [vehicleLabel(candidate), state].filter((part) => part !== null).join(LINE_SEPARATOR);
}

export function unsuitableLine(candidate: UnsuitableCandidate): string {
  return candidate.reasons
    .map((reason) => UNSUITABLE_REASON_LABELS[reason])
    .join(REASONS_SEPARATOR);
}

export function distanceText(candidate: CourierCandidate): string {
  return candidate.pickupDistanceM === null
    ? ASSIGN_TEXTS.NO_DISTANCE
    : PRICE_TEXTS.distance(pickupDistanceFormat.format(candidate.pickupDistanceM / METERS_PER_KM));
}

export function suitableSummary(count: number, parcelWeightKg: number | null): string {
  return ASSIGN_TEXTS.suitableFor(
    parcelWeightKg === null ? null : formatParcelWeight({ weightKg: parcelWeightKg }),
    formatCount(count),
    pluralize(count, COURIERS_PLURAL),
  );
}

export function emptyText(searchText: string, filter: VehicleFilter): string {
  return searchText.trim() === '' && filter === VEHICLE_FILTER_ALL
    ? ASSIGN_TEXTS.NOBODY
    : ASSIGN_TEXTS.NOTHING_FOUND;
}

export function keepSelection(
  selectedId: number | null,
  suitable: readonly CourierCandidate[],
): { selectedId: number | null; isLost: boolean } {
  if (selectedId === null || suitable.some((candidate) => candidate.courierId === selectedId)) {
    return { selectedId, isLost: false };
  }

  return { selectedId: null, isLost: true };
}
