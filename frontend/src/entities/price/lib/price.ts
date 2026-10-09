import { APP_LOCALE } from '@/shared/config';
import {
  COEFFICIENT_FRACTION_DIGITS,
  DISTANCE_FRACTION_DIGITS,
  MONEY_ROUNDING,
} from '../config/price';
import { PRICE_TEXTS } from '../config/texts';

const distanceFormat = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: DISTANCE_FRACTION_DIGITS,
});

const coefficientFormat = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: COEFFICIENT_FRACTION_DIGITS,
});

function roundMoney(amount: number): number {
  return Math.round(amount * MONEY_ROUNDING) / MONEY_ROUNDING;
}

// The price without the demand surcharge, and the surcharge (null when there is none).
export function splitPrice(
  price: number,
  coefficient: number,
): { base: number; surcharge: number | null } {
  const hasSurcharge = coefficient > 1;
  const base = hasSurcharge ? roundMoney(price / coefficient) : price;

  return { base, surcharge: hasSurcharge ? roundMoney(price - base) : null };
}

export function formatDistanceKm(km: number): string {
  return PRICE_TEXTS.distance(distanceFormat.format(km));
}

export function formatCoefficient(coefficient: number): string {
  return coefficientFormat.format(coefficient);
}
