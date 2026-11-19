import { ApiError, HTTP_STATUS } from '@/shared/api';
import { INVITE_FIELD } from './invite-form';

const MS_PER_HOUR = 3_600_000;

export const CONFLICT_TEXTS = {
  EMAIL_TAKEN: 'Пользователь с таким email уже зарегистрирован',
  PHONE_TAKEN: 'Пользователь с таким телефоном уже зарегистрирован',
} as const;

const CONFLICT_FIELDS: Record<string, string> = {
  [CONFLICT_TEXTS.EMAIL_TAKEN]: INVITE_FIELD.EMAIL,
  [CONFLICT_TEXTS.PHONE_TAKEN]: INVITE_FIELD.PHONE,
};

export function conflictFieldOf(message: string): string | null {
  return CONFLICT_FIELDS[message] ?? null;
}

export function withConflictField(error: unknown): unknown {
  if (!(error instanceof ApiError) || error.status !== HTTP_STATUS.CONFLICT) {
    return error;
  }

  const field = conflictFieldOf(error.message);

  return field === null
    ? error
    : new ApiError(error.status, error.message, [{ field, message: error.message }], error.body);
}

export function hoursLeft(expiresAt: Date, now: number): number {
  return Math.max(0, Math.round((expiresAt.getTime() - now) / MS_PER_HOUR));
}
