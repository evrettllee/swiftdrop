import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { OrderRefund } from '@/modules/payments/types/payments.types';

export type StaffCancelledOrder = {
  orderId: number;
  status: OrderStatus;
  refund: OrderRefund;
};
