import { SUPPORT_SEND_FAILURE, type SupportSendFailure } from '@/shared/support-api';

export const SUPPORT_THREAD_TEXTS = {
  EMPTY: 'Сообщений пока нет',
  RETRY: 'Повторить',
  incoming: (text: string) => `Новое сообщение: ${text}`,
} as const;

export const SEND_FAILURE_TEXTS: Record<
  Exclude<SupportSendFailure, typeof SUPPORT_SEND_FAILURE.CLOSED>,
  string
> = {
  [SUPPORT_SEND_FAILURE.TOO_MANY]: 'Слишком много сообщений, подождите минуту',
  [SUPPORT_SEND_FAILURE.NETWORK]: 'Не отправлено.',
  [SUPPORT_SEND_FAILURE.OTHER]: 'Не удалось отправить сообщение. Попробуйте ещё раз',
};
