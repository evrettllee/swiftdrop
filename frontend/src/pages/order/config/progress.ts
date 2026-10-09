import { ORDER_STATUS } from '@/shared/api';

// The steps of "Ход заказа" as the client sees them (the mockup).
export const PROGRESS_STEPS = [
  { status: ORDER_STATUS.PENDING, label: 'Новый' },
  { status: ORDER_STATUS.CONFIRMED, label: 'Подтверждён' },
  { status: ORDER_STATUS.COURIER_ASSIGNED, label: 'Курьер назначен' },
  { status: ORDER_STATUS.PICKED_UP, label: 'Курьер забрал' },
  { status: ORDER_STATUS.IN_TRANSIT, label: 'В пути' },
  { status: ORDER_STATUS.DELIVERED, label: 'Доставлен' },
] as const;

// An order that stopped early ends its progress with this step.
export const PROGRESS_STOP_LABELS: Partial<Record<string, string>> = {
  [ORDER_STATUS.CANCELLED]: 'Отменён',
  [ORDER_STATUS.REJECTED]: 'Отклонён',
};

export const PROGRESS_STATE = {
  DONE: 'done',
  CURRENT: 'current',
  TODO: 'todo',
  STOPPED: 'stopped',
} as const;
