import { useSyncExternalStore } from 'react';
import type { OrderTracking } from './order-tracking';
import type { OrderTrackingState } from './tracking-state';

export function useTrackingState(tracking: OrderTracking): OrderTrackingState {
  return useSyncExternalStore(tracking.subscribe, tracking.getState);
}
