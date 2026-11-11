import { getCourierProfile, refreshCourierProfile } from '@/entities/courier';
import { ApiError, getCourierHistoryOrder, HTTP_STATUS } from '@/shared/api';
import { ASSIGNMENT_EVENT, type MissedAssignment, missedAssignment } from '../lib/assignment';

function activeOrderId(): number | null {
  return getCourierProfile()?.activeOrderId ?? null;
}

async function isTakenAway(orderId: number): Promise<boolean> {
  try {
    await getCourierHistoryOrder(orderId);

    return false;
  } catch (error) {
    return (
      error instanceof ApiError &&
      (error.status === HTTP_STATUS.NOT_FOUND || error.status === HTTP_STATUS.FORBIDDEN)
    );
  }
}

export async function syncMissedAssignment(
  announce: (missed: MissedAssignment) => void,
): Promise<void> {
  const before = activeOrderId();

  if (!(await refreshCourierProfile())) {
    return;
  }

  const missed = missedAssignment(before, activeOrderId());

  if (missed === null) {
    return;
  }

  if (missed.event === ASSIGNMENT_EVENT.ASSIGNED || (await isTakenAway(missed.orderId))) {
    announce(missed);
  }
}
