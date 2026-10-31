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

// Stripe does not take a charge below 50 cents.
export const MIN_CHARGE_MINOR = 50;

// An order is paid once: the earliest of its paid payments is kept, the others are refunded.
export const KEPT_PAID_PAYMENTS = 1;

export const PAYMENT_EVENT = {
  PAID: 'paid',
  EXPIRED: 'expired',
} as const;

// What the payment system answered to closing a session: closed now, or it was no longer open
// (already paid or already expired) and could not be closed.
export const SESSION_EXPIRE_RESULT = {
  EXPIRED: 'expired',
  NOT_OPEN: 'not_open',
} as const;

export const CHECKOUT_SESSION_STATUS = {
  OPEN: 'open',
  COMPLETE: 'complete',
  EXPIRED: 'expired',
} as const;

// What happened to a pending payment of a cancelled order after its session was checked.
export const PENDING_PAYMENT_OUTCOME = {
  FAILED: 'failed',
  REFUNDED: 'refunded',
  LEFT_PENDING: 'left_pending',
} as const;

export const ORDER_REFUND = {
  NONE: 'none',
  PENDING: 'pending',
  REFUNDED: 'refunded',
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
  PAYMENT_ALREADY_STARTED: 'Оплата этого заказа уже начата. Обновите страницу заказа',
  AMOUNT_TOO_SMALL: 'Сумма заказа слишком мала для оплаты картой',
  START_FAILED: 'Не удалось начать оплату',
  REFUND_FAILED: 'Не удалось вернуть деньги, попробуйте позже',
} as const;
