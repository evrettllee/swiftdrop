import {
  CALCULATOR_TEXTS,
  DISTANCE_FRACTION_DIGITS,
  PRICE_FRACTION_DIGITS,
  PRICING_LOCALE,
} from '../constants';

const priceFormat = new Intl.NumberFormat(PRICING_LOCALE, {
  minimumFractionDigits: PRICE_FRACTION_DIGITS,
  maximumFractionDigits: PRICE_FRACTION_DIGITS,
});

const distanceFormat = new Intl.NumberFormat(PRICING_LOCALE, {
  minimumFractionDigits: DISTANCE_FRACTION_DIGITS,
  maximumFractionDigits: DISTANCE_FRACTION_DIGITS,
});

export function formatPrice(price: number, currency: string): string {
  return `${CALCULATOR_TEXTS.APPROX} ${priceFormat.format(price)} ${currency}`;
}

export function formatDistance(distanceKm: number): string {
  return `${distanceFormat.format(distanceKm)} ${CALCULATOR_TEXTS.DISTANCE_SUFFIX}`;
}

export function formatDuration(minutes: number): string {
  return `${CALCULATOR_TEXTS.APPROX} ${minutes} ${CALCULATOR_TEXTS.DURATION_SUFFIX}`;
}
