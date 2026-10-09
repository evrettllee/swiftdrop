import { ORDER_STATUS, type OrderDetails, type OrderStatus } from '@/shared/api';
import { PROGRESS_STATE, PROGRESS_STEPS, PROGRESS_STOP_LABELS } from '../config/progress';
import type { ProgressState, ProgressStep } from '../model/order-progress';

// For the client the manual search of a courier is still the "confirmed" step.
const STEP_OF_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT]: ORDER_STATUS.CONFIRMED,
};

function stateOf(index: number, reached: number): ProgressState {
  let state: ProgressState = PROGRESS_STATE.TODO;

  if (index < reached) {
    state = PROGRESS_STATE.DONE;
  } else if (index === reached) {
    state = PROGRESS_STATE.CURRENT;
  }

  return state;
}

// The steps of "Ход заказа" with the time each one was reached (the first time, from the history).
// A cancelled or rejected order shows the steps it passed and ends with its stop step.
export function buildProgress(order: OrderDetails): ProgressStep[] {
  const times = new Map<OrderStatus, Date>();

  for (const entry of order.history) {
    const status = STEP_OF_STATUS[entry.status] ?? entry.status;

    if (!times.has(status)) {
      times.set(status, entry.changedAt);
    }
  }

  const reached = PROGRESS_STEPS.reduce(
    (last, step, index) => (times.has(step.status) ? index : last),
    0,
  );
  const steps: ProgressStep[] = PROGRESS_STEPS.map((step, index) => ({
    key: step.status,
    label: step.label,
    time: times.get(step.status) ?? null,
    state: stateOf(index, reached),
  }));
  const stopLabel = PROGRESS_STOP_LABELS[order.status];

  return stopLabel === undefined
    ? steps
    : [
        ...steps.slice(0, reached + 1).map((step) => ({ ...step, state: PROGRESS_STATE.DONE })),
        {
          key: order.status,
          label: stopLabel,
          time: times.get(order.status) ?? null,
          state: PROGRESS_STATE.STOPPED,
        },
      ];
}
