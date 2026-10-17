import { ORDER_STATUS } from '@/shared/api';

// The steps of "Ход заказа" as the courier lived them: from the assignment on.
export const COURIER_PROGRESS_STEPS = [
  { status: ORDER_STATUS.COURIER_ASSIGNED, label: 'Назначен' },
  { status: ORDER_STATUS.PICKED_UP, label: 'Забрал посылку' },
  { status: ORDER_STATUS.IN_TRANSIT, label: 'В пути' },
  { status: ORDER_STATUS.DELIVERED, label: 'Доставлен' },
] as const;

// An order that stopped early ends its progress with this step.
export const COURIER_PROGRESS_STOP_LABELS: Partial<Record<string, string>> = {
  [ORDER_STATUS.CANCELLED]: 'Отменён',
};
