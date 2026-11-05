import { UI_TEXTS } from '@/shared/config';
import { SUPPORT_TICKET_STATUS, type SupportTicketStatus } from '@/shared/staff-api';

export const SUPPORT_TEXTS = {
  TITLE: UI_TEXTS.SUPPORT,
  PROFILE: UI_TEXTS.PROFILE,
  NEW: 'Новое обращение',
  TABS: 'Обращения',
  LIST: 'Мои обращения',
  SHOW_MORE: 'Показать ещё',
  EMPTY_TITLE: 'Обращений пока нет',
  EMPTY_OPEN: 'Если что-то пошло не так, напишите в поддержку',
  EMPTY_CLOSED: 'Здесь появятся решённые обращения',
  LOAD_FAILED: 'Не удалось загрузить обращения',
  RETRY: UI_TEXTS.RETRY,
  STAFF: 'поддержка',
  YOU: 'вы',
  TODAY: 'Сегодня',
  orderNumber: (number: string) => `Заказ ${number}`,
  preview: (who: string, text: string) => `${who}: ${text}`,
  joined: (parts: readonly string[]) => parts.join(', '),
} as const;

export const TAB_LABELS: Record<SupportTicketStatus, string> = {
  [SUPPORT_TICKET_STATUS.OPEN]: 'Открытые',
  [SUPPORT_TICKET_STATUS.CLOSED]: 'Закрытые',
};

export const TICKET_STATE = {
  AWAITING: 'awaiting',
  ANSWERED: 'answered',
  CLOSED: 'closed',
} as const;

export type TicketState = (typeof TICKET_STATE)[keyof typeof TICKET_STATE];

export const TICKET_STATE_LABELS: Record<TicketState, string> = {
  [TICKET_STATE.AWAITING]: 'Ждёт ответа',
  [TICKET_STATE.ANSWERED]: 'Есть ответ',
  [TICKET_STATE.CLOSED]: 'Закрыто',
};

export const TICKET_STATE_DOTS: Record<TicketState, string> = {
  [TICKET_STATE.AWAITING]: 'bg-status-new',
  [TICKET_STATE.ANSWERED]: 'bg-status-active',
  [TICKET_STATE.CLOSED]: 'bg-status-delivered',
};
