import { SUPPORT_AUTHOR_ROLE, type SupportAuthorRole } from '@/shared/support-api';

export const DIALOG_TEXTS = {
  LABEL: 'Обращение',
  MESSAGES: 'Переписка',
  CLOSE: 'Закрыть обращение',
  CLOSED: 'Закрыто',
  OPEN_ORDER: 'Открыть заказ',
  OPEN_ORDER_SHORT: 'Открыть',
  BACK: 'К обращениям',
  CALL: 'Позвонить',
  LOAD_FAILED: 'Не удалось загрузить обращение',
  NOT_FOUND: 'Обращение не найдено',
  NO_ACCESS: 'Нет доступа к обращению',
  RETRY: 'Повторить',
  TICKET_CLOSED: 'Обращение уже закрыто',
  CLOSE_TITLE: 'Закрыть обращение?',
  CLOSE_CONFIRM: 'Закрыть',
  CLOSE_KEEP: 'Оставить открытым',
  CLOSE_FAILED: 'Не удалось закрыть обращение. Попробуйте ещё раз',
  author: (name: string, role: string, phone: string | null) =>
    [name, role, phone].filter((part) => part !== null).join(', '),
  openedAt: (time: string) => `открыто в ${time}`,
  openedOn: (date: string) => `открыто ${date}`,
  orderTitle: (number: string) => `Заказ ${number}`,
  closedAt: (date: string) => `Обращение закрыто ${date}`,
  closedBy: (line: string, who: string) => `${line} · ${who}`,
  courierLine: (status: string, name: string) => `${status}, курьер ${name}`,
  statusAddress: (status: string, address: string) => `${status} · ${address}`,
} as const;

export const REPLY_PLACEHOLDERS: Record<SupportAuthorRole, string> = {
  [SUPPORT_AUTHOR_ROLE.CLIENT]: 'Ответ клиенту',
  [SUPPORT_AUTHOR_ROLE.COURIER]: 'Ответ курьеру',
};

export const CLOSE_WARNINGS: Record<SupportAuthorRole, string> = {
  [SUPPORT_AUTHOR_ROLE.CLIENT]: 'Клиент не сможет в нём писать',
  [SUPPORT_AUTHOR_ROLE.COURIER]: 'Курьер не сможет в нём писать',
};
