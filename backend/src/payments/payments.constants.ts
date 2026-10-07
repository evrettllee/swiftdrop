export const PAYMENTS_ROUTES = {
  BASE: 'payments',
  WEBHOOK: 'webhook',
} as const;

export const WEBHOOK_SIGNATURE_HEADER = 'stripe-signature';

// Stripe does not support BYN, so the charge is made in US dollars.
export const PAYMENT_CURRENCY = 'usd';

// Stripe needs a session to live at least 30 minutes, one more minute avoids a rejection
// caused by a small clock difference. An unpaid order is cancelled earlier, after 30 minutes.
export const CHECKOUT_SESSION_TTL_MINUTES = 31;

// Both rubles and dollars are counted in hundredths: kopecks and cents.
export const MINOR_UNITS_PER_MAJOR = 100;
export const AMOUNT_FRACTION_DIGITS = 2;

// Stripe does not take a charge below 50 cents.
export const MIN_CHARGE_MINOR = 50;

export const PAYMENT_EVENT = {
  PAID: 'paid',
  EXPIRED: 'expired',
} as const;

// After the payment page the client comes back to the page of the order with this parameter.
export const ORDER_PAGE_PATH = '/orders';
export const PAYMENT_RETURN_PARAM = 'payment';
export const PAYMENT_RETURN_RESULT = {
  SUCCESS: 'success',
  CANCELLED: 'cancelled',
} as const;

// The line of the order on the payment page.
export const PAYMENT_DESCRIPTION_PREFIX = 'Доставка SwiftDrop, заказ №';

export const PAYMENTS_ERROR_MESSAGES = {
  GATEWAY_UNAVAILABLE: 'Платёжная система временно недоступна, попробуйте позже',
  INVALID_SIGNATURE: 'Недействительная подпись уведомления',
  ORDER_NOT_PAYABLE: 'Заказ нельзя оплатить: он уже оплачен или отменён',
  AMOUNT_TOO_SMALL: 'Сумма заказа слишком мала для оплаты картой',
  START_FAILED: 'Не удалось начать оплату',
  REFUND_FAILED: 'Не удалось вернуть деньги, попробуйте позже',
} as const;
