export const PAYMENT_VIEW = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  REFUNDED: 'refunded',
} as const;

export type PaymentView = (typeof PAYMENT_VIEW)[keyof typeof PAYMENT_VIEW];

export const PAYMENT_VIEW_LABELS: Record<PaymentView, string> = {
  [PAYMENT_VIEW.PAID]: 'Оплачено',
  [PAYMENT_VIEW.UNPAID]: 'Не оплачено',
  [PAYMENT_VIEW.REFUNDED]: 'Деньги возвращены',
};
