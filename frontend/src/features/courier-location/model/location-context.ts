import { createContext, use } from 'react';
import type { LocationSharing } from './useLocationSharing';

export const LocationContext = createContext<LocationSharing | null>(null);

// What the cabinet knows of the position of the courier, for any page of it.
export function useCourierLocation(): LocationSharing {
  const location = use(LocationContext);

  if (location === null) {
    throw new Error('useCourierLocation is used outside CourierLocationProvider');
  }

  return location;
}
