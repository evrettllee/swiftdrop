import { TICKET_TOPIC, type TicketTopic } from '@/shared/staff-api';

export const TICKET_TOPIC_LABELS: Record<TicketTopic, string> = {
  [TICKET_TOPIC.ORDER_PROBLEM]: 'Проблема с заказом',
  [TICKET_TOPIC.PAYMENT]: 'Оплата',
  [TICKET_TOPIC.ACCOUNT]: 'Аккаунт',
  [TICKET_TOPIC.CLIENT_UNREACHABLE]: 'Клиент не выходит на связь',
  [TICKET_TOPIC.APP]: 'Работа приложения',
  [TICKET_TOPIC.OTHER]: 'Другое',
};

export const TICKET_TOPICS: readonly TicketTopic[] = [
  TICKET_TOPIC.ORDER_PROBLEM,
  TICKET_TOPIC.PAYMENT,
  TICKET_TOPIC.ACCOUNT,
  TICKET_TOPIC.CLIENT_UNREACHABLE,
  TICKET_TOPIC.APP,
  TICKET_TOPIC.OTHER,
];
