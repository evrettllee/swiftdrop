import { type OrderTracking, OrderRoutePoints } from '@/entities/order';
import type { ManagerOrderDetails } from '@/shared/staff-api';
import { Section } from '@/shared/ui/section';
import { MANAGER_ORDER_TEXTS } from '../config/texts';
import { OrderMap } from './OrderMap';

type RouteSectionProps = {
  order: ManagerOrderDetails;
  tracking: OrderTracking;
};

export function RouteSection({ order, tracking }: RouteSectionProps) {
  return (
    <Section title={MANAGER_ORDER_TEXTS.SECTION_ROUTE}>
      <OrderMap order={order} tracking={tracking} />
      <OrderRoutePoints pickup={order.route.from} delivery={order.route.to} />
    </Section>
  );
}
