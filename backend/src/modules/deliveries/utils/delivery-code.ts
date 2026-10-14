import { randomInt } from 'node:crypto';
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
