import type { OrderStatus } from '@/shared/api';
import {
  PROGRESS_STATE,
  type ProgressOrder,
  type ProgressSpec,
  type ProgressState,
  type ProgressStep,
} from '../model/order-progress';

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
// A cancelled or rejected order shows only the steps it passed (those with a time) and ends with
// its stop step; the rest are not shown.
export function buildOrderProgress(
  order: ProgressOrder,
  { steps: specs, stopLabels, aliases = {} }: ProgressSpec,
): ProgressStep[] {
  const times = new Map<OrderStatus, Date>();

  for (const entry of order.history) {
    const status = aliases[entry.status] ?? entry.status;

    if (!times.has(status)) {
      times.set(status, entry.changedAt);
    }
  }

  const reached = specs.reduce((last, step, index) => (times.has(step.status) ? index : last), 0);
  const steps: ProgressStep[] = specs.map((step, index) => ({
    key: step.status,
    label: step.label,
    time: times.get(step.status) ?? null,
    state: stateOf(index, reached),
  }));
  const stopLabel = stopLabels[order.status];

  return stopLabel === undefined
    ? steps
    : [
        ...steps
          .slice(0, reached + 1)
          .filter((step) => step.time !== null)
          .map((step) => ({ ...step, state: PROGRESS_STATE.DONE })),
        {
          key: order.status,
          label: stopLabel,
          time: times.get(order.status) ?? null,
          state: PROGRESS_STATE.STOPPED,
        },
      ];
}
