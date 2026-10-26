import { useState } from 'react';
import { useCourierLocation } from '@/features/courier-location';
import { useChatParamCleanup } from '@/features/order-chat';
import type { CourierMe, CourierVehicle } from '@/shared/api';
import { CONNECTION_STATUS, useConnectionStatus } from '@/shared/realtime';
import { CurrentOrder } from './CurrentOrder';
import { LineContent } from './LineContent';
import { OrderDelivered } from './OrderDelivered';

type WorkContentProps = {
  profile: CourierMe;
  vehicle: CourierVehicle;
};

// The line, or the order the courier carries. The position goes on being sent during the order, and
// from every page of the cabinet (CourierLocationProvider): the client and the route follow the
// courier by it.
type ClosedOrder = { orderId: number; closedAt: Date };

export function WorkContent({ profile, vehicle }: WorkContentProps) {
  const isConnected = useConnectionStatus() === CONNECTION_STATUS.CONNECTED;
  const location = useCourierLocation();
  // The closed order is kept here, above the screens that depend on the profile: the profile may
  // be refreshed without an order (the line, a cancelled order) and the screen must stay until the
  // courier presses «К работе».
  const [closed, setClosed] = useState<ClosedOrder | null>(null);
  useChatParamCleanup(closed === null && profile.activeOrderId !== null);

  if (closed !== null) {
    return (
      <OrderDelivered
        orderId={closed.orderId}
        closedAt={closed.closedAt}
        onBack={() => setClosed(null)}
      />
    );
  }

  return profile.activeOrderId === null ? (
    <LineContent
      profile={profile}
      vehicle={vehicle}
      isConnected={isConnected}
      location={location}
    />
  ) : (
    // A new order starts on its own screen, never on the code or the closed state of the last one.
    <CurrentOrder
      key={profile.activeOrderId}
      orderId={profile.activeOrderId}
      vehicle={vehicle}
      location={location}
      onDelivered={(orderId, closedAt) => setClosed({ orderId, closedAt })}
    />
  );
}
