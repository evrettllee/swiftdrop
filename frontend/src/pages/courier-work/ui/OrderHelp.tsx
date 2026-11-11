import { OrderSupportEntry } from '@/features/order-support-entry';
import type { CurrentCourierOrder } from '@/shared/api';
import { APP_ROUTES } from '@/shared/routes';

export function OrderHelp({ order }: { order: CurrentCourierOrder }) {
  return (
    <OrderSupportEntry
      orderId={order.orderId}
      ticket={order.supportTicket}
      supportPath={APP_ROUTES.COURIER_SUPPORT}
      placement="center"
    />
  );
}
