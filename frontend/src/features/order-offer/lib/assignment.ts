export const ASSIGNMENT_EVENT = {
  ASSIGNED: 'assigned',
  UNASSIGNED: 'unassigned',
} as const;

export type AssignmentEvent = (typeof ASSIGNMENT_EVENT)[keyof typeof ASSIGNMENT_EVENT];

export type AssignmentPlace = {
  activeOrderId: number | null;
  isOnWorkPage: boolean;
  hasOpenOffer: boolean;
};

export type AssignmentToast = {
  event: AssignmentEvent;
  hasOpenLink: boolean;
};

export type AssignmentDecision = {
  dropActiveOrder: boolean;
  closeOffer: boolean;
  toast: AssignmentToast | null;
  signal: boolean;
};

const NOTHING_SHOWN: AssignmentDecision = {
  dropActiveOrder: false,
  closeOffer: false,
  toast: null,
  signal: false,
};

function decideAssigned(orderId: number, place: AssignmentPlace): AssignmentDecision {
  const isNew = place.activeOrderId !== orderId;

  return {
    dropActiveOrder: false,
    closeOffer: place.hasOpenOffer,
    toast: isNew ? { event: ASSIGNMENT_EVENT.ASSIGNED, hasOpenLink: !place.isOnWorkPage } : null,
    signal: isNew,
  };
}

function decideUnassigned(orderId: number, place: AssignmentPlace): AssignmentDecision {
  if (place.activeOrderId !== orderId) {
    return NOTHING_SHOWN;
  }

  return {
    dropActiveOrder: true,
    closeOffer: false,
    toast: { event: ASSIGNMENT_EVENT.UNASSIGNED, hasOpenLink: false },
    signal: false,
  };
}

export function decideAssignment(
  event: AssignmentEvent,
  orderId: number,
  place: AssignmentPlace,
): AssignmentDecision {
  return event === ASSIGNMENT_EVENT.ASSIGNED
    ? decideAssigned(orderId, place)
    : decideUnassigned(orderId, place);
}

export type MissedAssignment = { event: AssignmentEvent; orderId: number };

export function missedAssignment(
  before: number | null,
  after: number | null,
): MissedAssignment | null {
  if (after !== null) {
    return after === before ? null : { event: ASSIGNMENT_EVENT.ASSIGNED, orderId: after };
  }

  return before === null ? null : { event: ASSIGNMENT_EVENT.UNASSIGNED, orderId: before };
}
