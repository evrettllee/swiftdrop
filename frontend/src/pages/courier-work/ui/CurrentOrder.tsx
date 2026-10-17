import type { CourierVehicle } from '@/shared/api';
import { LIST_STATUS } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { ContentLoader } from '@/shared/ui/page-loader';
import { PageTitle } from '@/shared/ui/page-title';
import { ORDER_ACTION, ORDER_STEPS } from '../config/order-steps';
import { COURIER_WORK_TEXTS, ORDER_TEXTS } from '../config/texts';
import { useCurrentOrder } from '../model/useCurrentOrder';
import type { LocationSharing } from '../model/useLocationSharing';
import { ORDER_VIEW, useOrderView } from '../model/useOrderView';
import { ConnectionAlert } from './ConnectionAlert';
import { DeliveryCodeScreen } from './DeliveryCodeScreen';
import { OrderDelivered } from './OrderDelivered';
import { OrderScreen } from './OrderScreen';

type CurrentOrderProps = {
  orderId: number;
  vehicle: CourierVehicle;
  location: LocationSharing;
};

// The order the courier carries: loaded by the screen itself, shown stage by stage, then the code
// of the recipient and the closed order.
export function CurrentOrder({ orderId, vehicle, location }: CurrentOrderProps) {
  const { view, openCode, showOrder, showDelivered } = useOrderView();
  const current = useCurrentOrder(orderId, view.kind === ORDER_VIEW.DELIVERED);
  const { order } = current;
  const step = order === null ? undefined : ORDER_STEPS[order.status];

  if (view.kind === ORDER_VIEW.DELIVERED) {
    return <OrderDelivered orderId={view.orderId} closedAt={view.closedAt} />;
  }

  if (order !== null && step !== undefined) {
    return view.kind === ORDER_VIEW.CODE && step.action === ORDER_ACTION.ENTER_CODE ? (
      <DeliveryCodeScreen
        orderId={order.orderId}
        location={location}
        onBack={() => showOrder()}
        onDelivered={(closedAt) => showDelivered(order.orderId, closedAt)}
        onStale={(message) => {
          showOrder(message);
          current.reload();
        }}
      />
    ) : (
      <OrderScreen
        order={order}
        step={step}
        vehicle={vehicle}
        location={location}
        deliveryError={view.kind === ORDER_VIEW.ORDER ? view.error : null}
        onChanged={current.setOrder}
        onStale={current.reload}
        onEnterCode={openCode}
      />
    );
  }

  if (current.status === LIST_STATUS.LOADING) {
    return <ContentLoader />;
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageTitle>{COURIER_WORK_TEXTS.PAGE_TITLE}</PageTitle>
      <ConnectionAlert />
      <div className="flex flex-col items-start gap-4">
        <InlineAlert variant="error">{ORDER_TEXTS.LOAD_ERROR}</InlineAlert>
        <Button variant="secondary" onClick={current.reload}>
          {ORDER_TEXTS.RETRY}
        </Button>
      </div>
    </div>
  );
}
