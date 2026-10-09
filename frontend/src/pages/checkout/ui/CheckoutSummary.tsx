import { ArrowRightIcon } from '@phosphor-icons/react';
import { type ReactNode, useId } from 'react';
import { ESTIMATE_STATUS, ESTIMATE_TEXTS, type EstimateView } from '@/features/estimate-price';
import { formatCoefficient, formatDistanceKm, PRICE_TEXTS, splitPrice } from '@/entities/price';
import type { PriceEstimate } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatMoney } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { PriceRow } from '@/shared/ui/price-row';
import { Spinner } from '@/shared/ui/spinner';
import { CHECKOUT_TEXTS } from '../config/texts';

const DIVIDER = <hr className="border-border" />;

function ReadyRows({ estimate }: { estimate: PriceEstimate }) {
  const { base, surcharge } = splitPrice(estimate.price, estimate.coefficient);

  return (
    <>
      <dl className="flex flex-col gap-2 text-small">
        <PriceRow label={PRICE_TEXTS.DISTANCE} value={formatDistanceKm(estimate.distanceKm)} />
        <PriceRow
          label={PRICE_TEXTS.TRAVEL_TIME}
          value={PRICE_TEXTS.travelTime(estimate.estimatedMinutes)}
        />
      </dl>
      {DIVIDER}
      <dl className="flex flex-col gap-2 text-small">
        <PriceRow label={PRICE_TEXTS.DELIVERY} value={formatMoney(base, estimate.currency)} />
        {surcharge === null ? null : (
          <PriceRow
            label={PRICE_TEXTS.surcharge(formatCoefficient(estimate.coefficient))}
            value={PRICE_TEXTS.extra(formatMoney(surcharge, estimate.currency))}
          />
        )}
      </dl>
      {surcharge === null ? null : (
        <InlineAlert
          variant="warning"
          title={CHECKOUT_TEXTS.demandTitle(formatCoefficient(estimate.coefficient))}
        >
          {CHECKOUT_TEXTS.DEMAND_TEXT}
        </InlineAlert>
      )}
      {DIVIDER}
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-semibold">{PRICE_TEXTS.TOTAL}</span>
        <span className="text-heading-lg font-bold tabular-nums">
          {formatMoney(estimate.price, estimate.currency)}
        </span>
      </div>
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
    body = (
      <div className="flex items-center gap-3 text-small text-fg-secondary">
        <Spinner />
        <span>{ESTIMATE_TEXTS.LOADING}</span>
      </div>
    );
  } else if (estimate.status === ESTIMATE_STATUS.NEEDS_PACKAGE) {
    body = <p className="text-small text-fg-secondary">{ESTIMATE_TEXTS.NEEDS_PACKAGE}</p>;
  }

  return (
    <aside
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-md lg:sticky lg:top-12 lg:p-6 dark:border dark:border-border"
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
        {isSubmitting ? null : (
          <ArrowRightIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        )}
      </Button>
    </aside>
  );
}
