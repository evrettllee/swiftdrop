import { StarIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '../../../../shared/constants/styles';
import { FEATURES } from '../../constants/sections';
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
            size={ICON_SIZE.XLARGE}
            weight={ICON_WEIGHT}
            aria-hidden="true"
            className={isFilled ? 'text-star' : 'text-fg-muted'}
          />
        ))}
      </div>
    </FeatureCard>
  );
}
