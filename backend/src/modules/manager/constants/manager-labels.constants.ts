import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { PaymentState } from './manager-orders.constants';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ожидает оплаты',
  confirmed: 'Подтверждён',
  awaiting_manual_assignment: 'Ждёт назначения',
  courier_assigned: 'Курьер назначен',
  picked_up: 'Курьер забрал',
  in_transit: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
  rejected: 'Отклонён',
};

export const PAYMENT_STATE_LABELS: Record<PaymentState, string> = {
  paid: 'Оплачен',
  refunded: 'Возвращён',
  unpaid: 'Не оплачен',
};
