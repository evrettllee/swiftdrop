import type { PAYMENT_VIEW } from '../config/payment';

export type PaymentView = (typeof PAYMENT_VIEW)[keyof typeof PAYMENT_VIEW];
