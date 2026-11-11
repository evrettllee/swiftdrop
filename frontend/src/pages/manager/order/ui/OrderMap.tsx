import { PackageIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { VEHICLE_TYPE_META } from '@/entities/courier';
import { type OrderTracking, useTrackingState, withCourierLine } from '@/entities/order';
import { ICON_SIZE, ICON_WEIGHT, MAP_FRAME_CLASS } from '@/shared/config';
import { useRouteLines } from '@/shared/lib/route-lines';
import { getManagerOrderRoute, type ManagerOrderDetails } from '@/shared/staff-api';
import { CourierEtaMarker, RouteMapView } from '@/shared/ui/route-map';
import { COURIER_ON_MAP_STATUSES } from '../config/statuses';

type OrderMapProps = {
  order: ManagerOrderDetails;
  tracking: OrderTracking;
};

export function OrderMap({ order, tracking }: OrderMapProps) {
  const { id, status, route } = order;
  const courierId = order.courier?.id ?? null;
  const { courierLeg, courierPosition, isPositionStale } = useTrackingState(tracking);
  const routeLines = useRouteLines(
    async (options) => {
      const answer = await getManagerOrderRoute(id, options);
      tracking.applyRoute(answer);

      return answer;
    },
    `${id}:${status}:${courierId ?? ''}`,
  );
  const lines = useMemo(() => withCourierLine(routeLines, courierLeg), [routeLines, courierLeg]);
  const courierPoint = COURIER_ON_MAP_STATUSES.includes(status) ? courierPosition : null;
  const vehicleType = order.courier?.vehicle?.type ?? null;
  const VehicleIcon = vehicleType === null ? PackageIcon : VEHICLE_TYPE_META[vehicleType].icon;

  return (
    <RouteMapView
      pickup={route.from}
      delivery={route.to}
      route={lines}
      courierPoint={courierPoint}
      className={MAP_FRAME_CLASS}
    >
      {courierPoint === null ? null : (
        <CourierEtaMarker
          point={courierPoint}
          icon={<VehicleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
          label={null}
          isOffline={isPositionStale}
        />
      )}
    </RouteMapView>
  );
}
