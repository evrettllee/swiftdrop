import { OrderRoutePoints } from '@/entities/order';
import type { OrderDetails, VehicleType } from '@/shared/api';
import { Section } from '@/shared/ui/section';
import { ORDER_DETAILS_TEXTS } from '../config/texts';
import { FINISHED_STATUSES } from '../model/order-status-groups';
import type { OrderLive } from '../model/useOrderLive';
import { OrderRouteMap } from './OrderRouteMap';

type OrderRouteProps = {
  order: OrderDetails;
  live: OrderLive;
  vehicleType: VehicleType | null;
};

export function OrderRoute({ order, live, vehicleType }: OrderRouteProps) {
  return (
    <Section title={ORDER_DETAILS_TEXTS.SECTION_ROUTE}>
      {FINISHED_STATUSES.includes(order.status) ? null : (
        <OrderRouteMap order={order} live={live} vehicleType={vehicleType} />
      )}
      <OrderRoutePoints pickup={order.pickup} delivery={order.delivery} />
    </Section>
  );
}
