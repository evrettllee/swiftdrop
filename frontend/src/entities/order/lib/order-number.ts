import { ORDER_TEXTS } from '../config/texts';

// For example "№48213"
export function formatOrderNumber(orderId: number): string {
  return `${ORDER_TEXTS.ORDER_NUMBER_PREFIX}${orderId}`;
}
