import { APP_LOCALE, MS_PER_MINUTE, MS_PER_SECOND } from '@/shared/config';
import { getDistanceKm, type GeoPoint } from '@/shared/lib/geo';
import { PICKUP_DISTANCE_FRACTION_DIGITS } from '../config/offer';
import { OFFER_TEXTS } from '../config/texts';

const SECONDS_PER_MINUTE = MS_PER_MINUTE / MS_PER_SECOND;
const TIMER_SECONDS_DIGITS = 2;

const distanceFormat = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: PICKUP_DISTANCE_FRACTION_DIGITS,
});

// For example "0:23"
export function formatTimeLeft(seconds: number): string {
  const rest = String(seconds % SECONDS_PER_MINUTE).padStart(TIMER_SECONDS_DIGITS, '0');

  return `${Math.floor(seconds / SECONDS_PER_MINUTE)}:${rest}`;
}

// For example "7 мин": a part of a minute counts as a whole one, the courier never arrives late.
export function formatEtaMinutes(seconds: number): string {
  return OFFER_TEXTS.minutes(Math.ceil(seconds / SECONDS_PER_MINUTE));
}

// For example "до забора, 2,1 км": the straight line from the courier, when their position is known.
export function formatToPickup(courier: GeoPoint | null, pickup: GeoPoint): string {
  return courier === null
    ? OFFER_TEXTS.TO_PICKUP
    : OFFER_TEXTS.toPickup(distanceFormat.format(getDistanceKm(courier, pickup)));
}
