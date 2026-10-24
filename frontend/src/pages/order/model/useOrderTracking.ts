import { useEffect, useEffectEvent, useState, useSyncExternalStore } from 'react';
import type { OrderStatus } from '@/shared/api';
import { onOrderEvent, SOCKET_EVENTS } from '@/shared/realtime';
import { OrderTracking } from './order-tracking';

// The events of the room of the order, while the page shows it. `onStatus` is called with every
// order:status of the order, so the page loads what the event does not carry (the history, the
// courier, the code).
function useTrackingEvents(
  orderId: number,
  tracking: OrderTracking,
  onStatus: (status: OrderStatus) => void,
): void {
  const statusChanged = useEffectEvent(onStatus);

  useEffect(() => {
    const unsubscribers = [
      onOrderEvent(SOCKET_EVENTS.ORDER_STATUS, (event) => {
        if (event.orderId === orderId) {
          tracking.applyStatus(event.status, event.estimatedDeliveryAt);
          statusChanged(event.status);
        }
      }),
      onOrderEvent(SOCKET_EVENTS.ORDER_ETA, (event) => {
        if (event.orderId === orderId) {
          tracking.applyEta(event.estimatedDeliveryAt, event.courierLeg, event.pickupEtaAt);
        }
      }),
      onOrderEvent(SOCKET_EVENTS.COURIER_LOCATION, (event) => {
        if (event.orderId === orderId) {
          const { latitude, longitude, updatedAt } = event;
          tracking.applyLocation({ latitude, longitude }, updatedAt);
        }
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [orderId, tracking]);
}

// One store per order: the page gives it the answers of the backend (applyStatus, applyRoute) and
// the room gives it the events. Leaving the order stops its timer.
export function useOrderTracking(orderId: number, onStatus: (status: OrderStatus) => void) {
  const [entry, setEntry] = useState(() => ({ orderId, tracking: new OrderTracking() }));
  let { tracking } = entry;

  // A new order gets a new store at once: nothing of the previous one is shown for it.
  if (entry.orderId !== orderId) {
    tracking = new OrderTracking();
    setEntry({ orderId, tracking });
  }

  const state = useSyncExternalStore(tracking.subscribe, tracking.getState);

  useEffect(() => () => tracking.dispose(), [tracking]);
  useTrackingEvents(orderId, tracking, onStatus);

  return { tracking, state };
}
