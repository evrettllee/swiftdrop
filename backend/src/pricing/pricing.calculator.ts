import {
  CENTS_PER_UNIT,
  CLASS_MULTIPLIERS,
  COEFFICIENT_MAX,
  COEFFICIENT_MIN,
  MONEY_PRECISION_DIGITS,
} from './pricing.constants';
import type { PriceInput } from './pricing.types';

export function clampCoefficient(value: number): number {
  return Math.min(Math.max(value, COEFFICIENT_MIN), COEFFICIENT_MAX);
}

function roundMoney(value: number): number {
  const cents = Number((value * CENTS_PER_UNIT).toPrecision(MONEY_PRECISION_DIGITS));

  return Math.round(cents) / CENTS_PER_UNIT;
}

export function calculatePrice(input: PriceInput): number {
  const { distanceKm, spec, vehicleType, rates, coefficient } = input;

  const fragileFee = spec.isFragile ? rates.fragileFee : 0;
  const basePrice =
    (distanceKm * rates.pricePerKm + spec.weightKg * rates.pricePerKg + fragileFee) *
    CLASS_MULTIPLIERS[vehicleType];

  return roundMoney(Math.max(rates.minPrice, basePrice) * clampCoefficient(coefficient));
}
