import { useEffect, useState } from 'react';
import { OrderTracking } from '@/entities/order';
import { onTypedSocketEvent, SOCKET_EVENTS } from '@/shared/realtime';
import type { ManagerOrderDetails } from '@/shared/staff-api';

export function useCourierTracking(order: ManagerOrderDetails): OrderTracking {
  const courierId = order.courier?.id ?? null;
  const key = `${order.id}:${courierId ?? ''}`;
  const [entry, setEntry] = useState(() => ({ key, tracking: new OrderTracking() }));
  let { tracking } = entry;

  if (entry.key !== key) {
    tracking = new OrderTracking();
    setEntry({ key, tracking });
  }

  useEffect(() => () => tracking.dispose(), [tracking]);

  useEffect(() => {
    tracking.applyStatus(order.status, order.estimatedDeliveryAt);
  }, [tracking, order.status, order.estimatedDeliveryAt]);

  useEffect(() => {
    if (courierId === null) {
      return undefined;
    }

    return onTypedSocketEvent(SOCKET_EVENTS.STAFF_COURIER_LOCATION, (payload) => {
      if (payload.courierId === courierId) {
        tracking.applyLocation({ latitude: payload.lat, longitude: payload.lng }, payload.at);
      }
    });
  }, [tracking, courierId]);

  return tracking;
}
