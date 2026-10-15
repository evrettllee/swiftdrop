import type { AddressParts } from '@/shared/api';
import { ROUTE_POINT, type RoutePointKind } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';

// One field of the route: the point, the text and the address parts (the city, the street and the
// house of an address found by Mapbox; a typed text has none until a suggestion is chosen).
export type RouteAddressValue = {
  point: GeoPoint | null;
  text: string;
  parts: AddressParts | null;
};

export type RouteAddressValues = Record<RoutePointKind, RouteAddressValue>;

export type AddressTexts = Record<RoutePointKind, string>;
export type AddressPartsByPoint = Record<RoutePointKind, AddressParts | null>;
export type LookupFlags = Record<RoutePointKind, boolean>;

export const EMPTY_TEXTS: AddressTexts = {
  [ROUTE_POINT.PICKUP]: '',
  [ROUTE_POINT.DELIVERY]: '',
};

export const NO_PARTS: AddressPartsByPoint = {
  [ROUTE_POINT.PICKUP]: null,
  [ROUTE_POINT.DELIVERY]: null,
};

export const NO_LOOKUPS: LookupFlags = {
  [ROUTE_POINT.PICKUP]: false,
  [ROUTE_POINT.DELIVERY]: false,
};
