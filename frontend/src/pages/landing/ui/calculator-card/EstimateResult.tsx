import { CheckCircleIcon } from '@phosphor-icons/react';
import { ESTIMATE_STATUS, ESTIMATE_TEXTS, type EstimateView } from '@/features/estimate-price';
import type { PriceEstimate } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { Spinner } from '@/shared/ui/spinner';
import { CALCULATOR_TEXTS } from '../../config/texts';
import { formatDistance, formatDuration, formatPrice } from '../../lib/estimate-format';

function ReadyBody({ estimate }: { estimate: PriceEstimate }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <p className="text-heading-lg font-bold tabular-nums">
          {formatPrice(estimate.price, estimate.currency)}
        </p>
        <div className="text-small text-fg-secondary lg:text-end">
          <p>{formatDistance(estimate.distanceKm)}</p>
          <p>{formatDuration(estimate.estimatedMinutes)}</p>
        </div>
      </div>
      <p className="flex items-center gap-2 text-small">
        <CheckCircleIcon
          size={ICON_SIZE.MEDIUM}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="shrink-0 text-success"
        />
        {CALCULATOR_TEXTS.IN_ZONE}
      </p>
    </div>
  );
}

function ResultBody({ view }: { view: EstimateView }) {
  switch (view.status) {
    case ESTIMATE_STATUS.READY:
      return <ReadyBody estimate={view.estimate} />;
    case ESTIMATE_STATUS.ERROR:
      return <InlineAlert variant="error">{view.message}</InlineAlert>;
    case ESTIMATE_STATUS.LOADING:
      return (
        <div className="flex items-center gap-3 text-body text-fg-secondary">
          <Spinner />
          <span>{ESTIMATE_TEXTS.LOADING}</span>
        </div>
      );
    case ESTIMATE_STATUS.NEEDS_ADDRESSES:
      return <p className="text-body text-fg-secondary">{ESTIMATE_TEXTS.NEEDS_ADDRESSES}</p>;
    case ESTIMATE_STATUS.NEEDS_PACKAGE:
      return <p className="text-body text-fg-secondary">{ESTIMATE_TEXTS.NEEDS_PACKAGE}</p>;
  }
}

// The minimum height keeps the card from jumping between the states.
export function EstimateResult({ view }: { view: EstimateView }) {
  return (
    <div aria-live="polite" className="flex min-h-32 flex-col gap-2 rounded-lg bg-selected p-4">
      <p className="text-small text-fg-secondary">{CALCULATOR_TEXTS.ESTIMATE_LABEL}</p>
      <ResultBody view={view} />
    </div>
  );
}
