import { ChatCircleIcon, ClockIcon, MapPinIcon, StarIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants/styles';
import { TRACKING } from '../constants/sections';
import { ButtonLookalike } from './ButtonLookalike';
import { TrackingMap } from './TrackingMap';

const { DEMO } = TRACKING;

// An example of the order screen of a client. It is a picture, not a working screen.
export function TrackingCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <TrackingMap />
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-heading-sm font-semibold tabular-nums">{DEMO.ORDER}</p>
            <p className="text-caption text-fg-secondary tabular-nums">{DEMO.DATE}</p>
          </div>
          <p className="flex items-center gap-2 text-small whitespace-nowrap">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full border-2 border-status-active"
            />
            {DEMO.STATUS}
          </p>
        </div>

        <p className="hidden items-center gap-2 text-small text-fg-secondary lg:flex">
          <MapPinIcon
            size={ICON_SIZE.SMALL}
            weight={ICON_WEIGHT}
            aria-hidden="true"
            className="shrink-0"
          />
          <span className="min-w-0 truncate">{DEMO.ROUTE}</span>
        </p>

        <div className="flex items-center gap-4 border-t border-border pt-4">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-small font-semibold text-on-primary"
          >
            {DEMO.COURIER_INITIALS}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{DEMO.COURIER_NAME}</p>
            <p className="text-small text-fg-secondary tabular-nums lg:hidden">
              {DEMO.VEHICLE}, {DEMO.RATING}
            </p>
            <p className="hidden items-center gap-1 text-small text-fg-secondary lg:flex">
              <span>{DEMO.VEHICLE}</span>
              <StarIcon
                size={ICON_SIZE.SMALL}
                weight={ICON_WEIGHT}
                aria-hidden="true"
                className="ms-2 shrink-0 text-star"
              />
              <span className="tabular-nums">{DEMO.RATING}</span>
            </p>
          </div>
          <ButtonLookalike className="hidden lg:inline-flex">
            <ChatCircleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} />
            {DEMO.MESSAGE}
          </ButtonLookalike>
        </div>

        <p className="flex items-center gap-2 rounded-md bg-selected p-4 text-small tabular-nums">
          <ClockIcon
            size={ICON_SIZE.MEDIUM}
            weight={ICON_WEIGHT}
            aria-hidden="true"
            className="hidden shrink-0 text-accent lg:block"
          />
          {DEMO.ARRIVAL_AT}
        </p>
      </div>
    </div>
  );
}
