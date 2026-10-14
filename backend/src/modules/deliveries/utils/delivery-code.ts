import { randomInt, timingSafeEqual } from 'node:crypto';
import {
  DELIVERY_CODE_LENGTH,
  DELIVERY_CODE_PAD,
  DELIVERY_CODE_RANGE,
} from '../constants/deliveries.constants';

// A code nobody can guess from the previous ones: the generator is cryptographic.
export function generateDeliveryCode(): string {
  return randomInt(DELIVERY_CODE_RANGE)
    .toString()
    .padStart(DELIVERY_CODE_LENGTH, DELIVERY_CODE_PAD);
}

// Compares in constant time, so the answer time tells nothing about the right digits.
export function deliveryCodesMatch(expected: string | null, given: string): boolean {
  return (
    expected !== null &&
    expected.length === given.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(given))
  );
}
