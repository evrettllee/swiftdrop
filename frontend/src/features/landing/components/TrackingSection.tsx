import { ChatCircleIcon, ClockIcon, MapPinIcon, type Icon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants';
import { LANDING_SECTION_ID, TRACKING } from '../constants';
import { LandingSection } from './LandingSection';
import { TrackingCard } from './TrackingCard';

const FEATURE_ICONS: Record<(typeof TRACKING.FEATURES)[number]['id'], Icon> = {
  eta: ClockIcon,
  position: MapPinIcon,
  chat: ChatCircleIcon,
};

// The text goes first in the page, the card first on a desktop: the two blocks share one grid row.
export function TrackingSection() {
  return (
    <LandingSection id={LANDING_SECTION_ID.TRACKING}>
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-6">
        <div className="flex flex-col gap-8 lg:col-span-4 lg:col-start-9 lg:row-start-1">
          <div className="flex flex-col gap-4">
            <h2 className="text-heading-lg font-bold text-balance">{TRACKING.TITLE}</h2>
            <p className="text-fg-secondary text-pretty">{TRACKING.LEAD}</p>
          </div>
          <ul className="hidden flex-col gap-6 lg:flex">
            {TRACKING.FEATURES.map((feature) => {
              const FeatureIcon = FEATURE_ICONS[feature.id];

              return (
                <li key={feature.id} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-4">
                  <FeatureIcon
                    size={ICON_SIZE.LARGE}
                    weight={ICON_WEIGHT}
                    aria-hidden="true"
                    className="text-accent"
                  />
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-small text-fg-secondary">{feature.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1">
          <TrackingCard />
        </div>
      </div>
    </LandingSection>
  );
}
