import { ApiError, HTTP_STATUS, NETWORK_ERROR_STATUS, SERVER_ERROR_STATUS_MIN } from '@/shared/api';
import { readZoneError, ZONE_ERROR_CODE, type ZoneErrorCode } from '@/shared/staff-api';
import { POLYGON_ERROR_TEXTS, ZONE_ERROR_TEXTS as ERROR_TEXTS } from '../config/texts';

export const ZONE_FAILURE = {
  CHANGED: 'changed',
  FIELD: 'field',
  ALERT: 'alert',
  RETRY: 'retry',
  POLYGON: 'polygon',
} as const;

export const ZONE_FIELD = {
  NAME: 'name',
  TARIFF: 'tariff',
  ACTIVE: 'active',
} as const;

export type ZoneField = (typeof ZONE_FIELD)[keyof typeof ZONE_FIELD];

export type ZoneFailure =
  | { kind: typeof ZONE_FAILURE.CHANGED; title: string }
  | { kind: typeof ZONE_FAILURE.FIELD; field: ZoneField; title: string }
  | { kind: typeof ZONE_FAILURE.ALERT; title: string; text: string | null }
  | { kind: typeof ZONE_FAILURE.RETRY; title: string; text: string }
  | { kind: typeof ZONE_FAILURE.POLYGON; title: string };

const FIELD_ERRORS: Partial<Record<ZoneErrorCode, { field: ZoneField; title: string }>> = {
  [ZONE_ERROR_CODE.ZONE_NAME_TAKEN]: { field: ZONE_FIELD.NAME, title: ERROR_TEXTS.NAME_TAKEN },
  [ZONE_ERROR_CODE.LAST_ACTIVE_ZONE]: { field: ZONE_FIELD.ACTIVE, title: ERROR_TEXTS.LAST_ACTIVE },
  [ZONE_ERROR_CODE.TARIFF_NOT_FOUND]: {
    field: ZONE_FIELD.TARIFF,
    title: ERROR_TEXTS.TARIFF_NOT_FOUND,
  },
};

const RETRY: ZoneFailure = {
  kind: ZONE_FAILURE.RETRY,
  title: ERROR_TEXTS.FAILED,
  text: ERROR_TEXTS.FAILED_TEXT,
};

export function toZoneFailure(error: unknown): ZoneFailure {
  if (
    !(error instanceof ApiError) ||
    error.status >= SERVER_ERROR_STATUS_MIN ||
    error.status === NETWORK_ERROR_STATUS
  ) {
    return RETRY;
  }

  const body = readZoneError(error.body);

  if (body?.code === ZONE_ERROR_CODE.ZONE_CHANGED || error.status === HTTP_STATUS.NOT_FOUND) {
    return { kind: ZONE_FAILURE.CHANGED, title: ERROR_TEXTS.ZONE_CHANGED };
  }

  if (body?.code === ZONE_ERROR_CODE.INVALID_POLYGON) {
    return {
      kind: ZONE_FAILURE.POLYGON,
      title: body.reason === null ? error.message : POLYGON_ERROR_TEXTS[body.reason],
    };
  }

  const field = body === null ? undefined : FIELD_ERRORS[body.code];

  if (field !== undefined) {
    return { kind: ZONE_FAILURE.FIELD, ...field };
  }

  if (error.status === HTTP_STATUS.CONFLICT) {
    return { kind: ZONE_FAILURE.ALERT, title: ERROR_TEXTS.BUSY, text: null };
  }

  return { kind: ZONE_FAILURE.ALERT, title: error.message, text: null };
}

export function fieldError(failure: ZoneFailure | null, field: ZoneField): string | undefined {
  return failure?.kind === ZONE_FAILURE.FIELD && failure.field === field
    ? failure.title
    : undefined;
}
