import {
  MINOR_UNITS_PER_MAJOR,
  MONEY_FRACTION_DIGITS,
} from '../../../common/constants/money.constants';

// US cents to charge for a price in BYN, the result is rounded up, so the shop never loses on rounding.
export function convertBynToUsdMinor(amountByn: number, bynPerUsd: number): number {
  const kopecks = Math.round(amountByn * MINOR_UNITS_PER_MAJOR);

  return Math.ceil(kopecks / bynPerUsd);
}

// An amount in hundredths as a decimal string, the way numeric columns take it.
export function formatMinorAmount(minor: number): string {
  return (minor / MINOR_UNITS_PER_MAJOR).toFixed(MONEY_FRACTION_DIGITS);
}
