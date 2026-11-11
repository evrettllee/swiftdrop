import { ApiError, HTTP_STATUS } from '@/shared/api';
import { ACTION_CONFLICT, type ActionConflict, readActionConflict } from '@/shared/staff-api';
import { ERROR_TEXTS, UNSUITABLE_REASON_LABELS } from '../config/texts';

export const FAILURE_KIND = {
  STALE: 'stale',
  CONFLICT: 'conflict',
  FIELD: 'field',
  RETRY: 'retry',
} as const;

export type FailureKind = (typeof FAILURE_KIND)[keyof typeof FAILURE_KIND];

export type ActionFailure = {
  kind: FailureKind;
  title: string;
  text: string | null;
};

const STALE_CODES: ReadonlySet<ActionConflict> = new Set([
  ACTION_CONFLICT.ORDER_NOT_ASSIGNABLE,
  ACTION_CONFLICT.ORDER_NOT_REASSIGNABLE,
  ACTION_CONFLICT.ORDER_NOT_RESTARTABLE,
  ACTION_CONFLICT.ORDER_NOT_CANCELLABLE,
  ACTION_CONFLICT.COURIER_CHANGED,
]);

const STALE: ActionFailure = {
  kind: FAILURE_KIND.STALE,
  title: ERROR_TEXTS.STALE_TITLE,
  text: ERROR_TEXTS.STALE_TEXT,
};

const RETRY: ActionFailure = {
  kind: FAILURE_KIND.RETRY,
  title: ERROR_TEXTS.FAILED_TITLE,
  text: ERROR_TEXTS.FAILED_TEXT,
};

function conflictFailure(body: unknown): ActionFailure {
  const conflict = readActionConflict(body);

  if (conflict === null) {
    return {
      kind: FAILURE_KIND.CONFLICT,
      title: ERROR_TEXTS.BUSY_TITLE,
      text: ERROR_TEXTS.BUSY_TEXT,
    };
  }

  if (STALE_CODES.has(conflict.code)) {
    return STALE;
  }

  if (conflict.code === ACTION_CONFLICT.SAME_COURIER) {
    return { kind: FAILURE_KIND.CONFLICT, title: ERROR_TEXTS.SAME_COURIER_TITLE, text: null };
  }

  return {
    kind: FAILURE_KIND.CONFLICT,
    title: ERROR_TEXTS.COURIER_UNAVAILABLE_TITLE,
    text: conflict.reason === null ? null : UNSUITABLE_REASON_LABELS[conflict.reason],
  };
}

export function toActionFailure(error: unknown): ActionFailure {
  if (!(error instanceof ApiError)) {
    return RETRY;
  }

  if (error.status === HTTP_STATUS.CONFLICT) {
    return conflictFailure(error.body);
  }

  if (error.status === HTTP_STATUS.NOT_FOUND) {
    return { ...STALE, title: ERROR_TEXTS.NOT_FOUND_TITLE };
  }

  if (error.status === HTTP_STATUS.BAD_REQUEST) {
    return {
      kind: FAILURE_KIND.FIELD,
      title: error.fieldErrors[0]?.message ?? error.message,
      text: null,
    };
  }

  return RETRY;
}
