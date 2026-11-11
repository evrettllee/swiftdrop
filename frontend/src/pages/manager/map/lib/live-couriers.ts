import type { CourierMapItem } from '@/shared/staff-api';
import { type LiveCourier, liveState, seenAtOf } from './courier-state';

export type PositionUpdate = { lat: number; lng: number; seenAt: number };

export function toLiveCouriers(
  items: readonly CourierMapItem[],
  receivedAt: number,
  updates: ReadonlyMap<number, PositionUpdate>,
  now: number,
): LiveCourier[] {
  return items.map((item) => {
    const loadedSeenAt = seenAtOf(item, receivedAt);
    const update = updates.get(item.courierId);
    const isUpdated =
      update !== undefined && (loadedSeenAt === null || update.seenAt > loadedSeenAt);
    const position = isUpdated ? update : { lat: item.lat, lng: item.lng, seenAt: loadedSeenAt };
    const courier = {
      courierId: item.courierId,
      name: item.name,
      phone: item.phone,
      vehicleType: item.vehicleType,
      ...position,
      activeOrder: item.activeOrder,
      openOfferOrderId: item.openOfferOrderId,
    };

    return { ...courier, state: liveState(courier, now) };
  });
}
