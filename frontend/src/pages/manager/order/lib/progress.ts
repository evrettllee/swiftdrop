import { buildOrderProgress, type ProgressStep } from '@/entities/order';
import { ORDER_STATUS } from '@/shared/api';
import { formatTime } from '@/shared/lib/format';
import {
  type ManagerOrderDetails,
  type ManagerOrderHistoryEntry,
  ORDER_ACTOR,
} from '@/shared/staff-api';
import { PROGRESS_STEPS, PROGRESS_STOP_LABELS } from '../config/progress';
import { ACTOR_LABELS, PROGRESS_TEXTS } from '../config/texts';

export function actorName(entry: ManagerOrderHistoryEntry): string {
  return entry.actorName ?? ACTOR_LABELS[entry.actor];
}

function noteOf(entry: ManagerOrderHistoryEntry, isRepeat: boolean): string {
  return [isRepeat ? formatTime(entry.changedAt) : null, actorName(entry), entry.comment]
    .filter((part) => part !== null && part !== '')
    .join(PROGRESS_TEXTS.NOTE_SEPARATOR);
}

function isNoted(entry: ManagerOrderHistoryEntry): boolean {
  return entry.actor === ORDER_ACTOR.STAFF || (entry.comment !== null && entry.comment !== '');
}

function notesOf(history: ManagerOrderDetails['history'], status: string): string[] {
  return history
    .filter((entry) => entry.status === status)
    .flatMap((entry, index) => (isNoted(entry) ? [noteOf(entry, index > 0)] : []));
}

export function buildManagerProgress(order: ManagerOrderDetails): ProgressStep[] {
  const awaiting = ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT;
  const hasAwaiting =
    order.status === awaiting || order.history.some((entry) => entry.status === awaiting);
  const steps = PROGRESS_STEPS.filter((step) => hasAwaiting || step.status !== awaiting);

  return buildOrderProgress(order, { steps, stopLabels: PROGRESS_STOP_LABELS }).map((step) => ({
    ...step,
    notes: notesOf(order.history, step.key),
  }));
}
