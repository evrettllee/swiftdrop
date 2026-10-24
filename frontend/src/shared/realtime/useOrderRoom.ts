import { useEffect, useSyncExternalStore } from 'react';
import { connectAppSocket } from './app-socket';
import { enterOrderRoom, getOrderRoomJoins, subscribeOrderRooms } from './order-room';

// Keeps the socket open and in the room of the order while the component is there; null asks for
// no room. Returns how many times the backend let the socket in: 0 until the first time. Events
// before a join and while the connection was lost are not received, so whoever shows the order
// loads it again each time this grows.
export function useOrderRoom(orderId: number | null): number {
  const joins = useSyncExternalStore(subscribeOrderRooms, () =>
    orderId === null ? 0 : getOrderRoomJoins(orderId),
  );

  useEffect(() => {
    if (orderId === null) {
      return undefined;
    }

    const release = connectAppSocket();
    const leave = enterOrderRoom(orderId);

    return () => {
      leave();
      release();
    };
  }, [orderId]);

  return joins;
}
