import { StarIcon } from '@phosphor-icons/react';
import { ICON_WEIGHT } from '../../../shared/constants';
import { FEATURES, ILLUSTRATION_ICON_SIZE } from '../constants';
import { FeatureCard } from './FeatureCard';

const { RATING } = FEATURES;

const STARS = Array.from({ length: RATING.MAX }, (_, index) => index < RATING.VALUE);

// The stars are a picture; the label tells the grade in words.
export function RatingCard() {
  return (
    <FeatureCard tone="page" className="lg:col-span-2" title={RATING.TITLE} text={RATING.TEXT}>
      <div role="img" aria-label={RATING.LABEL} className="flex gap-1">
        {STARS.map((isFilled, index) => (
          <StarIcon
            key={`star-${index}`}
            size={ILLUSTRATION_ICON_SIZE}
            weight={ICON_WEIGHT}
            aria-hidden="true"
            className={isFilled ? 'text-star' : 'text-fg-muted'}
          />
        ))}
      </div>
    </FeatureCard>
  );
}
