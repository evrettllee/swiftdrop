import type { PluralForms } from '@/shared/lib/format';

export const ORDER_SUPPORT_TEXTS = {
  NEED_HELP: 'Нужна помощь с заказом',
  TICKET: 'Обращение по заказу',
  AWAITING: 'Ждёт ответа поддержки',
  ANSWERED: 'Есть ответ поддержки',
  joined: (parts: readonly string[]) => parts.join(', '),
} as const;

export const NEW_MESSAGES_FORMS: PluralForms = {
  one: 'новое сообщение',
  few: 'новых сообщения',
  many: 'новых сообщений',
};
