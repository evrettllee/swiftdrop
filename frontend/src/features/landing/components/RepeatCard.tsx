import { FEATURES } from '../constants';
import { ButtonLookalike } from './ButtonLookalike';
import { FeatureCard } from './FeatureCard';

const { REPEAT } = FEATURES;

// The example row of an order is shown on a desktop only, as in the design.
export function RepeatCard() {
  return (
    <FeatureCard tone="page" className="lg:col-span-2" title={REPEAT.TITLE} text={REPEAT.TEXT}>
      <div className="hidden items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 lg:flex">
        <div>
          <p className="font-semibold tabular-nums">{REPEAT.ORDER}</p>
          <p className="flex items-center gap-2 text-small">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full bg-status-delivered"
            />
            {REPEAT.STATUS}
          </p>
        </div>
        <ButtonLookalike className="inline-flex">{REPEAT.ACTION}</ButtonLookalike>
      </div>
    </FeatureCard>
  );
}
