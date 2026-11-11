import { ORDER_HEADER_TEXTS } from '@/entities/order';
import { ORDER_ACTOR, type OrderActor } from '@/shared/staff-api';
import { UI_TEXTS } from '@/shared/config';

export const MANAGER_ORDER_TEXTS = {
  NOT_FOUND_TITLE: 'Заказ не найден',
  NOT_FOUND_TEXT: 'Возможно, ссылка устарела или номер заказа набран с ошибкой.',
  BACK_TO_ORDERS: ORDER_HEADER_TEXTS.BACK_TO_ORDERS,
  LOAD_FAILED_TITLE: 'Не удалось загрузить заказ',
  LOAD_FAILED: 'Проверьте соединение и попробуйте ещё раз.',
  RETRY: UI_TEXTS.RETRY,
  SECTION_ROUTE: 'Маршрут',
  SECTION_CLIENT: 'Клиент',
  SECTION_COURIER: 'Курьер',
  SECTION_RECIPIENT: 'Получатель и посылка',
  SECTION_OFFERS: 'Предложения курьерам',
  SECTION_PROGRESS: 'Ход заказа',
  SECTION_ACTIONS: 'Действия',
  SECTION_TICKETS: 'Обращения по заказу',
  SECTION_PAYMENT: 'Оплата',
  NAME: 'Имя',
  PHONE: 'Телефон',
  EMAIL: 'Email',
  RECIPIENT: 'Получатель',
  NO_PHONE: 'Не указан',
  CALL_COURIER: 'Позвонить курьеру',
  TARIFF: 'Тариф',
} as const;

export const STATUS_LINE_TEXTS = {
  PENDING_TITLE: 'Заказ ждёт оплаты',
  PENDING: 'Клиент ещё не оплатил заказ.',
  SEARCHING_TITLE: 'Автоназначение ищет курьера',
  SEARCHING: 'Как только курьер примет заказ, он появится на карте.',
  offeredTo: (count: string, couriers: string) => `Заказ предложен ${count} ${couriers}.`,
  AWAITING_TITLE: 'Автоназначение не нашло курьера',
  offeredNobody: (count: string, couriers: string) =>
    `Заказ предлагали ${count} ${couriers}, никто не принял.`,
  NO_OFFERS: 'Свободных курьеров рядом не нашлось.',
  waiting: (minutes: number) => `Ждёт назначения ${minutes} мин.`,
  pickupIn: (minutes: number) => `Курьер приедет за посылкой через ${minutes} мин`,
  HEADING_TO_PICKUP: 'Курьер едет за посылкой',
  CARRYING: 'Курьер везёт посылку',
  assignedByStaff: (time: string, name: string) => `Назначен вручную в ${time}, ${name}`,
  reassignedByStaff: (time: string, name: string) => `Переназначен в ${time}, ${name}`,
  acceptedAt: (time: string) => `Курьер принял заказ в ${time}.`,
  deliveryBy: (time: string) => `Доставка ориентировочно к ${time}.`,
  recipient: (name: string) => `Получатель: ${name}.`,
  CANCELLED_TITLE: 'Заказ отменён',
  REJECTED_TITLE: 'Заказ отклонён',
  reason: (comment: string) => `Причина: ${comment}`,
} as const;

export const COURIERS_DATIVE = { one: 'курьеру', few: 'курьерам', many: 'курьерам' } as const;

export const ACTOR_LABELS: Record<OrderActor, string> = {
  [ORDER_ACTOR.CLIENT]: 'Клиент',
  [ORDER_ACTOR.COURIER]: 'Курьер',
  [ORDER_ACTOR.STAFF]: 'Сотрудник',
  [ORDER_ACTOR.SYSTEM]: 'Система',
};

export const PROGRESS_TEXTS = {
  NOTE_SEPARATOR: ' · ',
} as const;

export const OFFERS_TEXTS = {
  COURIER: 'Курьер',
  PICKUP: 'До забора',
  ANSWER: 'Ответ',
  TIME: 'Время',
  minutes: (minutes: number) => `${minutes} мин`,
} as const;

export const TICKET_TEXTS = {
  SEPARATOR: ', ',
  waiting: (minutes: number) => `ждёт ответа ${minutes} мин`,
  CLOSED: 'закрыто',
} as const;

export const ACTION_TEXTS = {
  ASSIGN: 'Назначить курьера',
  RESTART: 'Запустить автоназначение',
  REASSIGN: 'Переназначить курьера',
  REASSIGN_SHORT: 'Переназначить',
  REASSIGN_HINT: 'Можно, пока курьер не забрал посылку.',
  CANCEL: 'Отменить заказ',
} as const;
