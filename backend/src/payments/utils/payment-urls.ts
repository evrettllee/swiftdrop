import { ORDER_PAGE_PATH, PAYMENT_RETURN_PARAM } from '../payments.constants';
import type { PaymentReturnResult } from '../payments.types';

// The address of the order page where the client returns from the payment page.
export function buildOrderReturnUrl(
  appUrl: string,
  orderId: number,
  result: PaymentReturnResult,
): string {
  const url = new URL(`${ORDER_PAGE_PATH}/${orderId}`, appUrl);
  url.searchParams.set(PAYMENT_RETURN_PARAM, result);

  return url.toString();
}
