import { MS_PER_SECOND } from '@/shared/config';

export const MAP_FILTER = {
  FREE: 'free',
  ON_ORDER: 'on_order',
  NO_SIGNAL: 'no_signal',
} as const;

export type MapFilter = (typeof MAP_FILTER)[keyof typeof MAP_FILTER];

export const MAP_FILTER_ORDER: readonly MapFilter[] = [
  MAP_FILTER.FREE,
  MAP_FILTER.ON_ORDER,
  MAP_FILTER.NO_SIGNAL,
];

export const NO_SIGNAL_TICK_MS = 10 * MS_PER_SECOND;

export const COURIER_PARAM = 'courier';
