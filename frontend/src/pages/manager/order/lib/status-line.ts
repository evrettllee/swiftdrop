import { ORDER_STATUS } from '@/shared/api';
import { formatCount, formatTime, pluralize } from '@/shared/lib/format';
import {
  ORDER_ACTOR,
  type ManagerOrderDetails,
  type ManagerOrderHistoryEntry,
} from '@/shared/staff-api';
import { COURIERS_DATIVE, STATUS_LINE_TEXTS as TEXTS } from '../config/texts';
import { actorName } from './progress';
import { minutesSince, minutesUntil } from './minutes';

export const STATUS_LINE_TONE = {
  NONE: 'none',
  WARNING: 'warning',
  SUCCESS: 'success',
  DANGER: 'danger',
} as const;

export type StatusLineTone = (typeof STATUS_LINE_TONE)[keyof typeof STATUS_LINE_TONE];

export type StatusLine = {
  tone: StatusLineTone;
  title: string;
  text: string | null;
};

export type StatusLineSource = {
  order: ManagerOrderDetails;
  pickupEtaAt: Date | null;
  nowMs: number;
};

function endSentence(text: string): string {
  return text.endsWith('.') ? text : `${text}.`;
}

function joinText(parts: readonly (string | null)[]): string | null {
  const text = parts.filter((part) => part !== null).join(' ');

  return text === '' ? null : text;
}

function lastEntryOf(order: ManagerOrderDetails): ManagerOrderHistoryEntry | null {
  return order.history.findLast((entry) => entry.status === order.status) ?? null;
}

function offeredCouriers(order: ManagerOrderDetails): number {
  return new Set(order.offers.map((offer) => offer.courier.id)).size;
}

function couriersText(order: ManagerOrderDetails, line: typeof TEXTS.offeredTo): string | null {
  const count = offeredCouriers(order);

  return count === 0 ? null : line(formatCount(count), pluralize(count, COURIERS_DATIVE));
}

function deliveryBy(order: ManagerOrderDetails): string | null {
  return order.estimatedDeliveryAt === null
    ? null
    : TEXTS.deliveryBy(formatTime(order.estimatedDeliveryAt));
}

function assignmentText(order: ManagerOrderDetails): string | null {
  const assigned = order.history.filter((entry) => entry.status === ORDER_STATUS.COURIER_ASSIGNED);
  const last = assigned.at(-1);

  if (last === undefined) {
    return null;
  }

  const time = formatTime(last.changedAt);

  if (last.actor !== ORDER_ACTOR.STAFF) {
    return TEXTS.acceptedAt(time);
  }

  return endSentence(
    assigned.length > 1
      ? TEXTS.reassignedByStaff(time, actorName(last))
      : TEXTS.assignedByStaff(time, actorName(last)),
  );
}

function cancelHead(entry: ManagerOrderHistoryEntry): string {
  const time = formatTime(entry.changedAt);

  switch (entry.actor) {
    case ORDER_ACTOR.STAFF:
      return endSentence(TEXTS.cancelledByStaff(time, actorName(entry)));
    case ORDER_ACTOR.CLIENT:
      return TEXTS.cancelledByClient(time);
    case ORDER_ACTOR.SYSTEM:
      return TEXTS.cancelledBySystem(time);
    default:
      return TEXTS.cancelledAt(time);
  }
}

function cancelText(entry: ManagerOrderHistoryEntry | null, fallback: Date): string {
  if (entry === null) {
    return TEXTS.cancelledAt(formatTime(fallback));
  }

  const head = cancelHead(entry);

  return entry.comment === null || entry.comment === ''
    ? head
    : `${head} ${TEXTS.reason(entry.comment)}`;
}

function activeLine({ order, pickupEtaAt, nowMs }: StatusLineSource): StatusLine {
  if (order.status === ORDER_STATUS.COURIER_ASSIGNED) {
    return {
      tone: STATUS_LINE_TONE.NONE,
      title:
        pickupEtaAt === null
          ? TEXTS.HEADING_TO_PICKUP
          : TEXTS.pickupIn(minutesUntil(pickupEtaAt, nowMs)),
      text: joinText([assignmentText(order), deliveryBy(order)]),
    };
  }

  return { tone: STATUS_LINE_TONE.NONE, title: TEXTS.CARRYING, text: deliveryBy(order) };
}

export function getStatusLine(source: StatusLineSource): StatusLine {
  const { order, nowMs } = source;

  switch (order.status) {
    case ORDER_STATUS.PENDING:
      return { tone: STATUS_LINE_TONE.WARNING, title: TEXTS.PENDING_TITLE, text: TEXTS.PENDING };
    case ORDER_STATUS.CONFIRMED:
      return {
        tone: STATUS_LINE_TONE.NONE,
        title: TEXTS.SEARCHING_TITLE,
        text: couriersText(order, TEXTS.offeredTo) ?? TEXTS.SEARCHING,
      };
    case ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT:
      return {
        tone: STATUS_LINE_TONE.WARNING,
        title: TEXTS.AWAITING_TITLE,
        text: joinText([
          couriersText(order, TEXTS.offeredNobody) ?? TEXTS.NO_OFFERS,
          TEXTS.waiting(minutesSince(order.statusChangedAt, nowMs)),
        ]),
      };
    case ORDER_STATUS.DELIVERED:
      return {
        tone: STATUS_LINE_TONE.SUCCESS,
        title: TEXTS.deliveredAt(formatTime(order.finishedAt ?? order.statusChangedAt)),
        text: TEXTS.recipient(order.recipient.name),
      };
    case ORDER_STATUS.CANCELLED:
    case ORDER_STATUS.REJECTED:
      return {
        tone: STATUS_LINE_TONE.DANGER,
        title:
          order.status === ORDER_STATUS.CANCELLED ? TEXTS.CANCELLED_TITLE : TEXTS.REJECTED_TITLE,
        text: cancelText(lastEntryOf(order), order.statusChangedAt),
      };
    default:
      return activeLine(source);
  }
}
