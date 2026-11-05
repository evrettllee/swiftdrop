import { useEffect } from 'react';
import { create } from 'zustand';
import type { CourierMe, CourierVehicle } from '@/shared/api';
import { getCourierMe } from '../api/get-courier-me';
import { setCourierPosition } from './courier-position';

export const COURIER_PROFILE_STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;

export type CourierProfileStatus =
  (typeof COURIER_PROFILE_STATUS)[keyof typeof COURIER_PROFILE_STATUS];

type CourierProfileState = {
  status: CourierProfileStatus;
  // Null until the profile is loaded, and when it could not be loaded.
  profile: CourierMe | null;
};

const INITIAL_STATE: CourierProfileState = {
  status: COURIER_PROFILE_STATUS.LOADING,
  profile: null,
};

// One profile for the whole cabinet: the frame shows whether the courier is on the line, and the
// pages read and change it.
const useCourierProfileStore = create<CourierProfileState>()(() => INITIAL_STATE);

export function useCourierProfile(): CourierMe | null {
  return useCourierProfileStore((state) => state.profile);
}

export function useCourierProfileStatus(): CourierProfileStatus {
  return useCourierProfileStore((state) => state.status);
}

export async function loadCourierProfile(signal?: AbortSignal): Promise<void> {
  useCourierProfileStore.setState({ status: COURIER_PROFILE_STATUS.LOADING });

  try {
    const profile = await getCourierMe(signal);
    useCourierProfileStore.setState({ status: COURIER_PROFILE_STATUS.READY, profile });
  } catch {
    // A request cancelled because the cabinet was left changes nothing.
    if (signal?.aborted !== true) {
      useCourierProfileStore.setState({ status: COURIER_PROFILE_STATUS.ERROR, profile: null });
    }
  }
}

// Loads the profile again without the loading state, so the page under it does not flash. A
// failure keeps the profile the page shows; the answer tells whether the profile came.
export async function refreshCourierProfile(): Promise<boolean> {
  try {
    const profile = await getCourierMe();
    useCourierProfileStore.setState({ status: COURIER_PROFILE_STATUS.READY, profile });

    return true;
  } catch {
    // The next change of the line or the next visit loads it again.
    return false;
  }
}

// The profile the backend answered with, for example after a change of the line.
export function setCourierProfile(profile: CourierMe): void {
  useCourierProfileStore.setState({ status: COURIER_PROFILE_STATUS.READY, profile });
}

// The vehicle the backend saved: the profile is not loaded again for it.
export function setCourierVehicle(vehicle: CourierVehicle): void {
  useCourierProfileStore.setState(({ profile }) => ({
    profile: profile === null ? null : { ...profile, vehicle },
  }));
}

export function dropActiveOrder(orderId: number): void {
  useCourierProfileStore.setState(({ profile }) => ({
    profile:
      profile === null || profile.activeOrderId !== orderId
        ? profile
        : { ...profile, activeOrderId: null },
  }));
}

// Loads the profile while the cabinet is open and forgets it (and the position) when the cabinet is
// left, so the next user of the tab never sees them.
export function useCourierProfileLoader(): void {
  useEffect(() => {
    const controller = new AbortController();

    void loadCourierProfile(controller.signal);

    return () => {
      controller.abort();
      useCourierProfileStore.setState(INITIAL_STATE);
      setCourierPosition(null);
    };
  }, []);
}
