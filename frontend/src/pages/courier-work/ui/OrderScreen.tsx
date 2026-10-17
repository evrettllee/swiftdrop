import type { CourierOrder, CourierVehicle } from '@/shared/api';
import { Divider } from '@/shared/ui/divider';
import { InlineAlert } from '@/shared/ui/inline-alert';
import type { OrderStep } from '../config/order-steps';
import type { LocationSharing } from '../model/useLocationSharing';
import { useOrderStep } from '../model/useOrderStep';
import { ConnectionAlert } from './ConnectionAlert';
import { GeoAlert } from './GeoAlert';
import { OrderActionBar } from './OrderActionBar';
import { OrderHeader } from './OrderHeader';
import { OrderMap } from './OrderMap';
import { OrderParcel } from './OrderParcel';
import { OrderStepButton } from './OrderStepButton';
import { OrderStops } from './OrderStops';

type OrderScreenProps = {
  order: CourierOrder;
  step: OrderStep;
  vehicle: CourierVehicle;
  location: LocationSharing;
  onChanged: (order: CourierOrder) => void;
  onStale: () => void;
};

// One column on a phone with the button in a bar above the menu; on the desktop the points on the
// left and the parcel with the button on the right.
export function OrderScreen({
  order,
  step,
  vehicle,
  location,
  onChanged,
  onStale,
}: OrderScreenProps) {
  const orderStep = useOrderStep({ onDone: onChanged, onStale });
  const button = (
    <OrderStepButton
      step={step}
      isPending={orderStep.isPending}
      onPress={() => void orderStep.run(order.orderId, step.action)}
    />
  );

  return (
    // On a phone the end of the page stays clear of the bar with the button (24px above it).
    <div className="flex flex-col gap-6 pb-15 lg:gap-8 lg:pb-0">
      <OrderHeader orderId={order.orderId} step={step} />
      <ConnectionAlert />
      {location.problem === null ? null : (
        <GeoAlert
          problem={location.problem}
          isChecking={location.isChecking}
          onRetry={() => void location.recheck()}
        />
      )}
      {orderStep.error === null ? null : (
        <InlineAlert variant="error">{orderStep.error}</InlineAlert>
      )}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-col gap-6 lg:flex-1 lg:gap-8">
          <OrderMap order={order} />
          <OrderStops order={order} step={step} vehicle={vehicle.type} />
        </div>
        <div className="lg:hidden">
          <Divider />
        </div>
        <OrderParcel order={order} step={step} button={button} />
      </div>
      <OrderActionBar>{button}</OrderActionBar>
    </div>
  );
}
