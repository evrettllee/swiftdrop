import type { CourierMe, CourierVehicle } from '@/shared/api';
import { CONNECTION_STATUS, useConnectionStatus } from '@/shared/realtime';
import { useLocationSharing } from '../model/useLocationSharing';
import { CurrentOrder } from './CurrentOrder';
import { LineContent } from './LineContent';

type WorkContentProps = {
  profile: CourierMe;
  vehicle: CourierVehicle;
};

// The line, or the order the courier carries. The position goes on being sent during the order:
// the client and the route follow the courier by it.
export function WorkContent({ profile, vehicle }: WorkContentProps) {
  const isConnected = useConnectionStatus() === CONNECTION_STATUS.CONNECTED;
  const location = useLocationSharing(profile.isAvailable && isConnected);

  return profile.activeOrderId === null ? (
    <LineContent
      profile={profile}
      vehicle={vehicle}
      isConnected={isConnected}
      location={location}
    />
  ) : (
    <CurrentOrder orderId={profile.activeOrderId} vehicle={vehicle} location={location} />
  );
}
