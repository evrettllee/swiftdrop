import type { OrderStatus } from '@/shared/api';

export const PROGRESS_STATE = {
  DONE: 'done',
  CURRENT: 'current',
  TODO: 'todo',
  STOPPED: 'stopped',
} as const;

export type ProgressState = (typeof PROGRESS_STATE)[keyof typeof PROGRESS_STATE];

export type ProgressStep = {
  key: string;
  label: string;
  time: Date | null;
  state: ProgressState;
};

// The steps of "Ход заказа" a page shows: each page names its own, as its person sees the order.
export type ProgressSpec = {
  steps: readonly { status: OrderStatus; label: string }[];
  // An order that stopped early ends its progress with this step.
  stopLabels: Partial<Record<string, string>>;
  // A status that counts as another step, for example a manual search as "confirmed".
  aliases?: Partial<Record<OrderStatus, OrderStatus>>;
};

// What the progress needs of an order: its status and the history of its statuses.
export type ProgressOrder = {
  status: OrderStatus;
  history: readonly { status: OrderStatus; changedAt: Date }[];
};
