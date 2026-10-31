import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { OrderRefund } from '@/modules/payments/types/payments.types';

export type CancelOrderRequest = {
  orderId: number;
  changedBy: number;
  clientId?: number;
  comment: string | null;
};

export type CancelOrderOutcome =
  { cancelled: true; refund: OrderRefund } | { cancelled: false; status: OrderStatus | null };

export type OrderCancellation =
  | {
      cancelled: true;
      refund: OrderRefund;
      revoked: { offerId: number; courierId: number }[];
      courierId: number | null;
    }
  | { cancelled: false; status: OrderStatus | null };
