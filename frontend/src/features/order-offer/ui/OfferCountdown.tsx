import { ClockIcon } from '@phosphor-icons/react';
import { useLayoutEffect, useRef } from 'react';
import { ICON_SIZE, ICON_WEIGHT, MS_PER_SECOND } from '@/shared/config';
import { OFFER_TTL_MS } from '../config/offer';
import { OFFER_TEXTS } from '../config/texts';
import { formatTimeLeft } from '../lib/offer-format';

const OFFER_TTL_SECONDS = OFFER_TTL_MS / MS_PER_SECOND;
const PERCENT = 100;

type CountdownProps = {
  secondsLeft: number;
  isUrgent: boolean;
};

// "0:23" next to the title; the last seconds turn to the warning color.
export function OfferTimeLeft({ secondsLeft, isUrgent }: CountdownProps) {
  return (
    <p className="flex shrink-0 items-center gap-1">
      <ClockIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="text-fg-secondary"
      />
      <span
        className={`text-heading-sm font-semibold tabular-nums ${isUrgent ? 'text-warning' : ''}`}
      >
        {formatTimeLeft(secondsLeft)}
      </span>
    </p>
  );
}

type OfferTimeBarProps = CountdownProps & {
  deadline: number;
};

// The share of the time left, as the width of the bar.
function getWidthLeft(deadline: number): number {
  return (Math.max(deadline - Date.now(), 0) / OFFER_TTL_MS) * PERCENT;
}

// The same time as a bar that empties smoothly, by the exact time left, frame by frame. It is a sign
// of the state, like the spinner, not a decoration: it moves the same when the user asks for less
// motion, and only ever down.
export function OfferTimeBar({ deadline, secondsLeft, isUrgent }: OfferTimeBarProps) {
  const fillRef = useRef<HTMLDivElement>(null);

  // Before the paint, so the bar never shows empty or full first.
  useLayoutEffect(() => {
    const bar = fillRef.current;

    if (bar === null) {
      return undefined;
    }

    const fill: HTMLDivElement = bar;

    let width = PERCENT;
    let frame = 0;

    function draw(): void {
      // A late frame or a clock moved back never makes the bar grow.
      width = Math.min(width, getWidthLeft(deadline));
      fill.style.width = `${width}%`;

      if (width > 0) {
        frame = requestAnimationFrame(draw);
      }
    }

    draw();

    return () => cancelAnimationFrame(frame);
  }, [deadline]);

  return (
    <div
      role="progressbar"
      aria-label={OFFER_TEXTS.TIME_LEFT}
      aria-valuemin={0}
      aria-valuemax={OFFER_TTL_SECONDS}
      aria-valuenow={secondsLeft}
      aria-valuetext={formatTimeLeft(secondsLeft)}
      className="-mt-2 h-1 overflow-hidden rounded-full bg-border lg:mt-0"
    >
      <div
        ref={fillRef}
        className={`h-full rounded-full ${isUrgent ? 'bg-warning' : 'bg-accent'}`}
      />
    </div>
  );
}
