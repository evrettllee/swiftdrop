import type { ReactNode } from 'react';
import { ParcelBasicFacts, ParcelFact, ParcelFacts } from '@/entities/order';
import { formatDistanceKm } from '@/entities/price';
import type { CourierOrder } from '@/shared/api';
import { Divider } from '@/shared/ui/divider';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { Section } from '@/shared/ui/section';
import { ORDER_ACTION, type OrderStep } from '../config/order-steps';
import { ORDER_STEP_TEXTS, ORDER_TEXTS } from '../config/texts';

type OrderParcelProps = {
  order: CourierOrder;
  step: OrderStep;
  // The main button: at the end of the card on the desktop, in the bar of a phone otherwise.
  button: ReactNode;
};

// The parcel: a section of the page on a phone, a card next to the points on the desktop.
export function OrderParcel({ order, step, button }: OrderParcelProps) {
  const { parcel } = order;

  return (
    <div className="flex flex-col gap-6 lg:w-100 lg:shrink-0 lg:gap-4 lg:rounded-xl lg:border lg:border-transparent lg:bg-surface lg:p-6 lg:shadow-md lg:dark:border-border">
      <Section title={ORDER_TEXTS.PARCEL}>
        <ParcelFacts>
          <ParcelBasicFacts parcel={parcel} />
          {/* The distance is for the desktop only, as in the design. */}
          <ParcelFact label={ORDER_TEXTS.DISTANCE} className="hidden lg:flex">
            {formatDistanceKm(order.distanceKm)}
          </ParcelFact>
        </ParcelFacts>
      </Section>
      {step.action === ORDER_ACTION.ENTER_CODE ? (
        <InlineAlert variant="info" title={ORDER_STEP_TEXTS.CODE_HINT} />
      ) : null}
      {/* On a phone the button is in the bar: only one of the two is ever in the page. */}
      <div className="hidden lg:contents">
        <Divider />
        {button}
      </div>
    </div>
  );
}
