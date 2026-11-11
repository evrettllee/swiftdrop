import { SUPPORT_TOPIC, type SupportTopic } from '@/shared/support-api';
import { ROLE } from '@/shared/session';

export const NEW_TICKET_TEXTS = {
  TITLE: 'Новое обращение',
  TOPIC: 'Тема',
  SUBJECT: 'Тема обращения',
  SUBJECT_PLACEHOLDER: 'Коротко, о чём вопрос',
  ORDER: 'Заказ',
  NO_ORDER: 'Без заказа',
  CHANGE: 'Изменить',
  MESSAGE: 'Сообщение',
  MESSAGE_PLACEHOLDER: 'Опишите, что случилось',
  SEND: 'Отправить',
  CANCEL: 'Отмена',
  SUBJECT_REQUIRED: 'Напишите тему обращения',
  MESSAGE_REQUIRED: 'Напишите сообщение',
  ALREADY_OPEN: 'По этому заказу уже есть открытое обращение',
  TOO_MANY: 'Можно создать не больше 5 обращений в час',
  FAILED: 'Не удалось отправить обращение. Попробуйте ещё раз',
  TODAY: 'Сегодня',
  counter: (length: number, max: number) => `${length} / ${max}`,
  orderLine: (parts: readonly string[]) => parts.join(', '),
} as const;

export type TopicOption = {
  topic: SupportTopic;
  title: string;
  hint?: string;
};

export type AuthorRole = typeof ROLE.CLIENT | typeof ROLE.COURIER;

export const TOPICS_BY_ROLE: Record<AuthorRole, readonly TopicOption[]> = {
  [ROLE.CLIENT]: [
    {
      topic: SUPPORT_TOPIC.ORDER_PROBLEM,
      title: 'Проблема с заказом',
      hint: 'Опоздание, курьер, посылка',
    },
    { topic: SUPPORT_TOPIC.PAYMENT, title: 'Оплата и возврат', hint: 'Списание, возврат денег' },
    { topic: SUPPORT_TOPIC.ACCOUNT, title: 'Аккаунт и вход', hint: 'Пароль, вход, телефон' },
    { topic: SUPPORT_TOPIC.OTHER, title: 'Другое' },
  ],
  [ROLE.COURIER]: [
    {
      topic: SUPPORT_TOPIC.ORDER_PROBLEM,
      title: 'Проблема с заказом',
      hint: 'Забор, вручение, код',
    },
    {
      topic: SUPPORT_TOPIC.CLIENT_UNREACHABLE,
      title: 'Клиент не на связи',
      hint: 'Не отвечает, не открывает',
    },
    {
      topic: SUPPORT_TOPIC.APP,
      title: 'Приложение или геопозиция',
      hint: 'Ошибки, позиция не обновляется',
    },
    { topic: SUPPORT_TOPIC.OTHER, title: 'Другое' },
  ],
};

export const RECENT_ORDERS_LIMIT = 10;
