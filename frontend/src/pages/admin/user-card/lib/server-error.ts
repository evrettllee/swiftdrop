import { ApiError, getApiErrorMessage, HTTP_STATUS } from '@/shared/api';

export type ActionError = { title: string; text: string | null; isConflict: boolean };

const SENTENCE_END = '. ';

export function splitMessage(message: string): { title: string; text: string | null } {
  const end = message.indexOf(SENTENCE_END);

  if (end === -1) {
    return { title: message, text: null };
  }

  const rest = message.slice(end + SENTENCE_END.length).trim();

  return { title: message.slice(0, end), text: /[.!?…]$/.test(rest) ? rest : `${rest}.` };
}

export function actionErrorOf(error: unknown, fallback: string): ActionError {
  return {
    ...splitMessage(getApiErrorMessage(error, fallback)),
    isConflict: error instanceof ApiError && error.status === HTTP_STATUS.CONFLICT,
  };
}
