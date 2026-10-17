import { ROUTE_POINT, ROUTE_POINT_LABELS } from '@/shared/config';
import { RoutePointMark } from '@/shared/ui/route-point-mark';
import { formatFullAddress } from '../lib/order-address';

type Address = Parameters<typeof formatFullAddress>[0];

type OrderRoutePointsProps = {
  pickup: Address;
  delivery: Address;
};

// The two points of the route with their full addresses, under the map of an order.
export function OrderRoutePoints({ pickup, delivery }: OrderRoutePointsProps) {
  const points = [
    { kind: ROUTE_POINT.PICKUP, address: pickup },
    { kind: ROUTE_POINT.DELIVERY, address: delivery },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      {points.map(({ kind, address }) => (
        <div key={kind} className="flex items-start gap-3">
          <RoutePointMark kind={kind} className="mt-2" />
          <div className="flex min-w-0 flex-col">
            <span className="text-small text-fg-secondary">{ROUTE_POINT_LABELS[kind]}</span>
            <span>{formatFullAddress(address)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
