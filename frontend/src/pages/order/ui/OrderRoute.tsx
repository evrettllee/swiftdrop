import { memo } from 'react';
import { OrderRoutePoints } from '@/entities/order';
import type { OrderDetails, VehicleType } from '@/shared/api';
import { Section } from '@/shared/ui/section';
import { ORDER_DETAILS_TEXTS } from '../config/texts';
import { FINISHED_STATUSES } from '../model/order-status-groups';
import type { OrderTracking } from '../model/order-tracking';
import { OrderRouteMap } from './OrderRouteMap';

type OrderRouteProps = {
  order: OrderDetails;
  tracking: OrderTracking;
  routeReloadToken: number;
  vehicleType: VehicleType | null;
};

export const OrderRoute = memo(function OrderRoute({
  order,
  tracking,
  routeReloadToken,
  vehicleType,
}: OrderRouteProps) {
  return (
    <Section title={ORDER_DETAILS_TEXTS.SECTION_ROUTE}>
      {FINISHED_STATUSES.includes(order.status) ? null : (
        <OrderRouteMap
          order={order}
          tracking={tracking}
          routeReloadToken={routeReloadToken}
          vehicleType={vehicleType}
        />
      )}
      <OrderRoutePoints pickup={order.pickup} delivery={order.delivery} />
    </Section>
  );
});
