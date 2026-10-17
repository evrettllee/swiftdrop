import { create } from 'zustand';
import type { GeoPoint } from '@/shared/lib/geo';

type CourierPositionState = {
  // The last position the device gave on the line; null off the line.
  position: GeoPoint | null;
};

// Where the courier is, for the cabinet as a whole: the work page writes it, an offer shows the
// distance to the pickup point from it.
const useCourierPositionStore = create<CourierPositionState>()(() => ({ position: null }));

export function useCourierPosition(): GeoPoint | null {
  return useCourierPositionStore((state) => state.position);
}

export function setCourierPosition(position: GeoPoint | null): void {
  useCourierPositionStore.setState({ position });
}
