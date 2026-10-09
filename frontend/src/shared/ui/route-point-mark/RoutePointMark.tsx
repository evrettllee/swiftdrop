import { ROUTE_POINT, type RoutePointKind } from '@/shared/config';

// The same marks as on the map: an empty ring for the pickup, a solid dot for the delivery.
const MARK_CLASS: Record<RoutePointKind, string> = {
  [ROUTE_POINT.PICKUP]: 'border-2 border-accent',
  [ROUTE_POINT.DELIVERY]: 'bg-fg',
};

type RoutePointMarkProps = {
  kind: RoutePointKind;
  className?: string;
};

export function RoutePointMark({ kind, className = '' }: RoutePointMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`size-2.5 shrink-0 rounded-full ${MARK_CLASS[kind]} ${className}`}
    />
  );
}
