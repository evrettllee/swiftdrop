import type { ReactNode } from 'react';
import { useCourierProfile } from '@/entities/courier';
import { CONNECTION_STATUS, useConnectionStatus } from '@/shared/realtime';
import { LocationContext } from '../model/location-context';
import { useLocationSharing } from '../model/useLocationSharing';

type CourierLocationProviderProps = {
  children: ReactNode;
};

// The one place that follows the device of the courier: a single watch and a single sender for the
// whole cabinet, while the courier is on the line (an order or not) and the socket is connected.
// Pages read what it knows through useCourierLocation, whichever page is open.
export function CourierLocationProvider({ children }: CourierLocationProviderProps) {
  const profile = useCourierProfile();
  const isConnected = useConnectionStatus() === CONNECTION_STATUS.CONNECTED;
  const location = useLocationSharing(profile?.isAvailable === true && isConnected);

  return <LocationContext value={location}>{children}</LocationContext>;
}
