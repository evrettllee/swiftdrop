export const ROUTE_POINT = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
} as const;

export type RoutePointKind = (typeof ROUTE_POINT)[keyof typeof ROUTE_POINT];

export const ROUTE_POINT_LABELS: Record<RoutePointKind, string> = {
  [ROUTE_POINT.PICKUP]: 'Откуда',
  [ROUTE_POINT.DELIVERY]: 'Куда',
};

export const ROUTE_POINT_ORDER = [ROUTE_POINT.PICKUP, ROUTE_POINT.DELIVERY] as const;

export const ADDRESS_PLACEHOLDER = 'Улица и номер дома';
// Shown while the address of a point set on the map is looked up, and when it has none.
export const POINT_ON_MAP_TEXT = 'Точка на карте';
