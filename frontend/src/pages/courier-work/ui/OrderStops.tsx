import { formatFullAddress } from '@/entities/order';
import type { ReactNode } from 'react';
import type { CourierOrder, VehicleType } from '@/shared/api';
import { ROUTE_POINT, type RoutePointKind } from '@/shared/config';
import { Divider } from '@/shared/ui/divider';
import { RoutePointMark } from '@/shared/ui/route-point-mark';
import { Section } from '@/shared/ui/section';
import type { OrderStep } from '../config/order-steps';
import { ORDER_TEXTS } from '../config/texts';
import { StopContact } from './StopContact';

type StopAddressProps = {
  kind: RoutePointKind;
  address: CourierOrder['pickup'];
};

function StopAddress({ kind, address }: StopAddressProps) {
  return (
    <div className="flex items-start gap-3">
      <RoutePointMark kind={kind} className="mt-2" />
      <p className="flex min-w-0 flex-col">
        <span className="text-small text-fg-secondary">{ORDER_TEXTS.ADDRESS}</span>
        <span>{formatFullAddress(address)}</span>
      </p>
    </div>
  );
}

type OrderStopsProps = {
  order: CourierOrder;
  step: OrderStep;
  vehicle: VehicleType;
  chatButton: ReactNode;
};

// Before the pickup: where to pick up with the sender, then where it goes. After it: where to
// deliver with the recipient.
export function OrderStops({ order, step, vehicle, chatButton }: OrderStopsProps) {
  if (step.target === ROUTE_POINT.DELIVERY) {
    return (
      <Section title={ORDER_TEXTS.DELIVERY}>
        <StopAddress kind={ROUTE_POINT.DELIVERY} address={order.delivery} />
        <StopContact
          role={ORDER_TEXTS.RECIPIENT}
          contact={order.recipient}
          callLabel={ORDER_TEXTS.CALL_RECIPIENT}
          point={order.delivery}
          vehicle={vehicle}
          chatButton={chatButton}
        />
      </Section>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <Section title={ORDER_TEXTS.PICKUP}>
        <StopAddress kind={ROUTE_POINT.PICKUP} address={order.pickup} />
        <StopContact
          role={ORDER_TEXTS.SENDER}
          contact={order.sender}
          callLabel={ORDER_TEXTS.CALL_SENDER}
          point={order.pickup}
          vehicle={vehicle}
          chatButton={chatButton}
        />
      </Section>
      <Divider />
      <Section title={ORDER_TEXTS.DELIVERY_NEXT}>
        <StopAddress kind={ROUTE_POINT.DELIVERY} address={order.delivery} />
      </Section>
    </div>
  );
}
