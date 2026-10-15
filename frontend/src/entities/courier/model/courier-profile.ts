import { useEffect } from 'react';
import { create } from 'zustand';
import type { CourierMe } from '@/shared/api';
import { getCourierMe } from '../api/get-courier-me';

type CourierProfileState = {
  // Null until the profile is loaded, and when it could not be loaded.
  profile: CourierMe | null;
};

// One profile for the whole cabinet: the frame shows whether the courier is on the line, and the
// pages change it.
export const useCourierProfileStore = create<CourierProfileState>()(() => ({ profile: null }));

export function useCourierProfile(): CourierMe | null {
  return useCourierProfileStore((state) => state.profile);
}

// Loads the profile while the cabinet is open and forgets it when the cabinet is left, so the next
// user of the tab never sees it.
export function useCourierProfileLoader(): void {
  useEffect(() => {
    const controller = new AbortController();

    getCourierMe(controller.signal).then(
      (profile) => useCourierProfileStore.setState({ profile }),
      () => {
        // The cabinet works without it: the status shows only the connection.
      },
    );

    return () => {
      controller.abort();
      useCourierProfileStore.setState({ profile: null });
    };
  }, []);
}
