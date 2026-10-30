export const MANAGER_COURIERS_ROUTES = {
  BASE: 'manager/couriers',
  MAP: 'map',
} as const;

export const COURIERS_MAP_LIMIT = 500;

export const COURIER_MAP_STATE = {
  FREE: 'free',
  ON_ORDER: 'on_order',
  OFFER: 'offer',
  NO_SIGNAL: 'no_signal',
} as const;

export const COURIER_MAP_STATE_VALUES = [
  COURIER_MAP_STATE.FREE,
  COURIER_MAP_STATE.ON_ORDER,
  COURIER_MAP_STATE.OFFER,
  COURIER_MAP_STATE.NO_SIGNAL,
] as const;

export type CourierMapState = (typeof COURIER_MAP_STATE_VALUES)[number];
