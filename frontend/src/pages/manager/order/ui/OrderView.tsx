import { useState } from 'react';
import { OrderHeader, STATUS_AUDIENCE } from '@/entities/order';
import {
  ORDER_ACTION,
  type OrderAction,
  OrderActionDialog,
} from '@/features/manager-order-actions';
import { MAIN_COLUMN_CLASS, SIDE_COLUMN_CLASS, SIDE_COLUMN_LAYOUT_CLASS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import type { ManagerOrderDetails } from '@/shared/staff-api';
import { Divider } from '@/shared/ui/divider';
import { hasActions, toActionTarget } from '../lib/order-facts';
import { useCourierTracking } from '../model/useCourierTracking';
import { ActionsPanel } from './ActionsPanel';
import { ClientSection } from './ClientSection';
import { CourierSection } from './CourierSection';
import { OffersSection } from './OffersSection';
import { OrderStatusLine } from './OrderStatusLine';
import { PaymentPanel } from './PaymentPanel';
import { ProgressSection } from './ProgressSection';
import { RecipientSection } from './RecipientSection';
import { RouteSection } from './RouteSection';
import { TicketsPanel } from './TicketsPanel';

const FIRST_ON_PHONE = 'max-lg:-order-2';
const SECOND_ON_PHONE = 'max-lg:-order-1';

type OrderViewProps = {
  order: ManagerOrderDetails;
  onChanged: () => void;
};

export function OrderView({ order, onChanged }: OrderViewProps) {
  const tracking = useCourierTracking(order);
  const [action, setAction] = useState<OrderAction | null>(null);

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <OrderHeader
        orderId={order.id}
        status={order.status}
        createdAt={order.createdAt}
        ordersPath={APP_ROUTES.MANAGER_ORDERS}
        audience={STATUS_AUDIENCE.STAFF}
      />
      <div className={SIDE_COLUMN_LAYOUT_CLASS}>
        <div className={`contents lg:flex lg:flex-col lg:gap-8 ${MAIN_COLUMN_CLASS}`}>
          <OrderStatusLine order={order} tracking={tracking} className={FIRST_ON_PHONE} />
          <RouteSection order={order} tracking={tracking} />
          <Divider />
          <ClientSection client={order.client} />
          {order.courier === null ? null : (
            <>
              <Divider />
              <CourierSection
                courier={order.courier}
                onReassign={
                  order.actions.canReassign ? () => setAction(ORDER_ACTION.REASSIGN) : null
                }
              />
            </>
          )}
          <Divider />
          <RecipientSection recipient={order.recipient} parcel={order.parcel} />
          {order.offers.length === 0 ? null : (
            <>
              <Divider />
              <OffersSection offers={order.offers} />
            </>
          )}
          <Divider />
          <ProgressSection order={order} />
        </div>
        <div className={`contents lg:flex lg:flex-col lg:gap-6 ${SIDE_COLUMN_CLASS}`}>
          {hasActions(order.actions) ? (
            <ActionsPanel
              actions={order.actions}
              className={SECOND_ON_PHONE}
              onAction={setAction}
            />
          ) : null}
          {order.tickets.length === 0 ? null : (
            <TicketsPanel tickets={order.tickets} className={SECOND_ON_PHONE} />
          )}
          <PaymentPanel order={order} />
        </div>
      </div>
      <OrderActionDialog
        target={toActionTarget(order)}
        action={action}
        onClose={() => setAction(null)}
        onChanged={onChanged}
      />
    </div>
  );
}
