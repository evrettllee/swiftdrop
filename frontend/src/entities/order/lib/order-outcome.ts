import { formatTime } from '@/shared/lib/format';
import { ORDER_ACTOR, type OrderActor } from '@/shared/staff-api';
import { ORDER_OUTCOME_TEXTS as TEXTS } from '../config/outcome';

export type CancelEntry = { actor: OrderActor; changedAt: Date };

export function cancelledLine(
  entry: CancelEntry | null,
  fallback: Date,
  staffName: string,
): string {
  if (entry === null) {
    return TEXTS.cancelledAt(formatTime(fallback));
  }

  const time = formatTime(entry.changedAt);

  switch (entry.actor) {
    case ORDER_ACTOR.STAFF:
      return TEXTS.cancelledByStaff(time, staffName);
    case ORDER_ACTOR.CLIENT:
      return TEXTS.cancelledByClient(time);
    case ORDER_ACTOR.SYSTEM:
      return TEXTS.cancelledBySystem(time);
    default:
      return TEXTS.cancelledAt(time);
  }
}

export function deliveredLine(at: Date): string {
  return TEXTS.deliveredAt(formatTime(at));
}
