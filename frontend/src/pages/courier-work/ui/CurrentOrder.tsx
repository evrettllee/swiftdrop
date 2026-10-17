import type { CourierVehicle } from '@/shared/api';
import { LIST_STATUS } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { ContentLoader } from '@/shared/ui/page-loader';
import { PageTitle } from '@/shared/ui/page-title';
import { ORDER_STEPS } from '../config/order-steps';
import { COURIER_WORK_TEXTS, ORDER_TEXTS } from '../config/texts';
import { useCurrentOrder } from '../model/useCurrentOrder';
import type { LocationSharing } from '../model/useLocationSharing';
import { ConnectionAlert } from './ConnectionAlert';
import { OrderScreen } from './OrderScreen';

type CurrentOrderProps = {
  orderId: number;
  vehicle: CourierVehicle;
  location: LocationSharing;
};

// The order the courier carries: loaded by the screen itself, shown stage by stage.
export function CurrentOrder({ orderId, vehicle, location }: CurrentOrderProps) {
  const current = useCurrentOrder(orderId);
  const { order } = current;
  const step = order === null ? undefined : ORDER_STEPS[order.status];

  if (order !== null && step !== undefined) {
    return (
      <OrderScreen
        order={order}
        step={step}
        vehicle={vehicle}
        location={location}
        onChanged={current.setOrder}
        onStale={current.reload}
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
