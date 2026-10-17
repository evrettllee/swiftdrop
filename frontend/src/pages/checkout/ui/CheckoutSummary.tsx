import { ArrowRightIcon } from '@phosphor-icons/react';
import { type ReactNode, useId } from 'react';
import { ESTIMATE_STATUS, ESTIMATE_TEXTS, type EstimateView } from '@/features/estimate-price';
import {
  DeliveryPriceRows,
  formatCoefficient,
  formatDistanceKm,
  PRICE_TEXTS,
  PriceTotal,
  splitPrice,
} from '@/entities/price';
import type { PriceEstimate } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT, SIDE_COLUMN_CLASS } from '@/shared/config';
import { formatMoney } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { BlockLoader } from '@/shared/ui/page-loader';
import { PriceRow } from '@/shared/ui/price-row';
import { CHECKOUT_TEXTS } from '../config/texts';

function ReadyRows({ estimate }: { estimate: PriceEstimate }) {
  const { surcharge } = splitPrice(estimate.price, estimate.coefficient);

  return (
    <>
      <dl className="flex flex-col gap-2 text-small">
        <PriceRow label={PRICE_TEXTS.DISTANCE} value={formatDistanceKm(estimate.distanceKm)} />
        <PriceRow
          label={PRICE_TEXTS.TRAVEL_TIME}
          value={PRICE_TEXTS.travelTime(estimate.estimatedMinutes)}
        />
      </dl>
      <Divider />
      <dl className="flex flex-col gap-2 text-small">
        <DeliveryPriceRows
          price={estimate.price}
          coefficient={estimate.coefficient}
          currency={estimate.currency}
        />
      </dl>
      {surcharge === null ? null : (
        <InlineAlert
          variant="warning"
          title={CHECKOUT_TEXTS.demandTitle(formatCoefficient(estimate.coefficient))}
        >
          {CHECKOUT_TEXTS.DEMAND_TEXT}
        </InlineAlert>
      )}
      <Divider />
      <PriceTotal value={formatMoney(estimate.price, estimate.currency)} />
    </>
  );
}

type CheckoutSummaryProps = {
  estimate: EstimateView;
  formError: string | null;
  isSubmitting: boolean;
  formId: string;
};

// "Стоимость": the price of the route and the package, and the button that places the order.
export function CheckoutSummary({
  estimate,
  formError,
  isSubmitting,
  formId,
}: CheckoutSummaryProps) {
  const headingId = useId();
  let body: ReactNode = (
    <p className="text-small text-fg-secondary">{ESTIMATE_TEXTS.NEEDS_ADDRESSES}</p>
  );

  if (estimate.status === ESTIMATE_STATUS.READY) {
    body = <ReadyRows estimate={estimate.estimate} />;
  } else if (estimate.status === ESTIMATE_STATUS.ERROR) {
    body = <InlineAlert variant="error">{estimate.message}</InlineAlert>;
  } else if (estimate.status === ESTIMATE_STATUS.LOADING) {
    body = <BlockLoader text={ESTIMATE_TEXTS.LOADING} className="text-small text-fg-secondary" />;
  } else if (estimate.status === ESTIMATE_STATUS.NEEDS_PACKAGE) {
    body = <p className="text-small text-fg-secondary">{ESTIMATE_TEXTS.NEEDS_PACKAGE}</p>;
  }

  return (
    <aside
      aria-labelledby={headingId}
      className={`${SIDE_COLUMN_CLASS} flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-md lg:sticky lg:top-12 lg:p-6 dark:border dark:border-border`}
    >
      <h2 id={headingId} className="text-heading-sm font-semibold text-balance">
        {CHECKOUT_TEXTS.SECTION_SUMMARY}
      </h2>
      <div aria-live="polite" className="flex flex-col gap-4">
        {body}
      </div>
      {formError === null ? null : <InlineAlert variant="error">{formError}</InlineAlert>}
      <Button type="submit" form={formId} fullWidth loading={isSubmitting}>
        {CHECKOUT_TEXTS.SUBMIT}
        <ArrowRightIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
      </Button>
    </aside>
  );
}
