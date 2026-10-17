import { WarningIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { formatParcelSize, formatParcelWeight } from '@/entities/order';
import { formatDistanceKm } from '@/entities/price';
import type { CourierOrder } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Divider } from '@/shared/ui/divider';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { Section } from '@/shared/ui/section';
import { ORDER_ACTION, type OrderStep } from '../config/order-steps';
import { ORDER_STEP_TEXTS, ORDER_TEXTS } from '../config/texts';

// On a phone the facts are columns as wide as their values and wrap; on the desktop they are rows
// with the value at the end.
const FACT_LAYOUT_CLASS =
  'min-w-0 flex-col lg:flex-row lg:items-baseline lg:justify-between lg:gap-4 lg:text-small';
const FACT_CLASS = `flex ${FACT_LAYOUT_CLASS}`;
const VALUE_CLASS = 'font-semibold tabular-nums lg:text-end';

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
        <dl className="flex flex-wrap gap-x-8 gap-y-4 lg:flex-col lg:flex-nowrap lg:gap-2">
          <div className={FACT_CLASS}>
            <dt className="text-small text-fg-secondary">{ORDER_TEXTS.WEIGHT}</dt>
            <dd className={VALUE_CLASS}>{formatParcelWeight(parcel)}</dd>
          </div>
          <div className={FACT_CLASS}>
            <dt className="text-small text-fg-secondary">{ORDER_TEXTS.SIZE}</dt>
            <dd className={VALUE_CLASS}>{formatParcelSize(parcel)}</dd>
          </div>
          <div className={FACT_CLASS}>
            <dt className="text-small text-fg-secondary">{ORDER_TEXTS.FRAGILE}</dt>
            {parcel.isFragile ? (
              <dd className="flex items-center gap-1 font-semibold text-warning">
                <WarningIcon size={ICON_SIZE.SMALL} weight={ICON_WEIGHT} aria-hidden="true" />
                {ORDER_TEXTS.YES}
              </dd>
            ) : (
              <dd className="font-semibold">{ORDER_TEXTS.NO}</dd>
            )}
          </div>
          {/* The distance is for the desktop only, as in the design. */}
          <div className={`hidden ${FACT_LAYOUT_CLASS} lg:flex`}>
            <dt className="text-small text-fg-secondary">{ORDER_TEXTS.DISTANCE}</dt>
            <dd className={VALUE_CLASS}>{formatDistanceKm(order.distanceKm)}</dd>
          </div>
        </dl>
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
