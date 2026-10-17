import { APP_LOCALE } from '@/shared/config';
import { formatMoney } from '@/shared/lib/format';
import { DISTANCE_FRACTION_DIGITS } from '../config/estimate-format';
import { CALCULATOR_TEXTS } from '../config/texts';

const distanceFormat = new Intl.NumberFormat(APP_LOCALE, {
  minimumFractionDigits: DISTANCE_FRACTION_DIGITS,
  maximumFractionDigits: DISTANCE_FRACTION_DIGITS,
});

// The estimate is approximate, unlike the exact amount of an order: "≈ 12,50 BYN".
export function formatPrice(price: number, currency: string): string {
  return `${CALCULATOR_TEXTS.APPROX} ${formatMoney(price, currency)}`;
}

export function formatDistance(distanceKm: number): string {
  return `${distanceFormat.format(distanceKm)} ${CALCULATOR_TEXTS.DISTANCE_SUFFIX}`;
}

export function formatDuration(minutes: number): string {
  return `${CALCULATOR_TEXTS.APPROX} ${minutes} ${CALCULATOR_TEXTS.DURATION_SUFFIX}`;
}
