import { useId } from 'react';
import type { OrderDetails } from '@/shared/api';
import { ROUTE_POINT, ROUTE_POINT_LABELS } from '@/shared/config';
import { RouteMapView } from '@/shared/ui/route-map';
import { RoutePointMark } from '@/shared/ui/route-point-mark';
import { ORDER_DETAILS_TEXTS } from '../config/texts';
import { formatFullAddress } from '../lib/order-details-format';

type OrderRouteProps = {
  order: OrderDetails;
};

export function OrderRoute({ order }: OrderRouteProps) {
  const headingId = useId();
  const points = [
    { kind: ROUTE_POINT.PICKUP, address: order.pickup },
    { kind: ROUTE_POINT.DELIVERY, address: order.delivery },
  ] as const;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-heading-sm font-semibold text-balance">
        {ORDER_DETAILS_TEXTS.SECTION_ROUTE}
      </h2>
      <RouteMapView pickup={order.pickup} delivery={order.delivery} className="h-40 lg:h-45" />
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
    </section>
  );
}
