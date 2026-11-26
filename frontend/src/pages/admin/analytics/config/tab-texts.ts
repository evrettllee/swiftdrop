import { APP_CURRENCY } from '@/shared/config';
import { formatDecimal, formatDurationMinutes, formatWhole, pluralize } from '@/shared/lib/format';
import {
  CLIENT_FORMS,
  DECLINE_GENITIVE_FORMS,
  DELIVERY_FORMS,
  OFFER_FORMS,
  ORDER_DATIVE_FORMS,
  ORDER_FORMS,
  TICKET_FORMS,
} from './texts';

export const BUSINESS_TEXTS = {
  KPI_ORDERS: 'Заказов оформлено',
  KPI_REVENUE: 'Выручка',
  KPI_AVG_CHECK: 'Средний чек',
  KPI_REFUNDS: 'Возвраты',
  FUNNEL_TITLE: 'Воронка заказов',
  FUNNEL_SUBTITLE: 'Доля от оформленных за период',
  STAGE_CREATED: 'Оформлено',
  STAGE_PAID: 'Оплачено',
  STAGE_ASSIGNED: 'Курьер назначен',
  STAGE_DELIVERED: 'Доставлено',
  LOSSES_TITLE: 'Где теряются заказы',
  LOSS_UNPAID: 'Не оплатили за 30 минут',
  LOSS_CANCELLED_BEFORE: 'Отменены до оплаты',
  lossCancelledAfter: (client: number, system: number, staff: number): string =>
    `Отменены после оплаты: клиентом ${formatWhole(client)}, системой ${formatWhole(system)}, сотрудником ${formatWhole(staff)}`,
  LOSS_IN_PROGRESS: 'Ещё в работе на конец периода',
  REVENUE_TITLE: `Выручка по дням, ${APP_CURRENCY}`,
  REVENUE_SUBTITLE: 'Только доставленные заказы, без возвратов',
  revenueAria: (minText: string, maxText: string, totalText: string): string =>
    `Выручка по дням: от ${minText} до ${maxText}, всего ${totalText}`,
} as const;

export const DELIVERY_TEXTS = {
  KPI_ON_TIME: 'Доставлено вовремя',
  KPI_AVG_TIME: 'Среднее время доставки',
  KPI_AUTO_ASSIGNED: 'Назначено автоматически',
  KPI_SEARCH: 'Поиск курьера',
  PAID_TO_DELIVERY: 'от оплаты до вручения',
  IN_AVERAGE: 'в среднем',
  ON_TIME_TITLE: 'Доставлено вовремя по дням, %',
  ON_TIME_SUBTITLE: 'К времени, обещанному клиенту при назначении курьера',
  ON_TIME_EMPTY: 'За период не было доставок со сроком',
  OFFERS_TITLE: 'Ответы курьеров на предложения',
  OFFER_ACCEPTED: 'Приняли',
  OFFER_DECLINED: 'Отказались',
  OFFER_EXPIRED: 'Не ответили за 30 с',
  AUTO_SUMMARY: 'Назначено автоматически',
  MANUAL_SUMMARY: 'Назначено менеджером вручную',
  ZONES_TITLE: 'По зонам',
  ZONES_SUBTITLE: 'Зона по адресу забора',
  ZONES_EMPTY: 'За период заказов по зонам не было',
  COL_ZONE: 'Зона',
  COL_ORDERS: 'Заказов',
  COL_ON_TIME: 'Вовремя',
  COL_AVG_TIME: 'Среднее время',
  COL_MANUAL: 'Вручную назначено',
  COL_REVENUE: `Выручка, ${APP_CURRENCY}`,
  manualOrders: (count: number): string =>
    `${formatWhole(count)} ${pluralize(count, ORDER_FORMS)} вручную`,
  offersSubtitle: (total: number, orders: number, maxDeclines: number): string =>
    `${formatWhole(total)} ${pluralize(total, OFFER_FORMS)} по ${formatWhole(orders)} ${pluralize(orders, ORDER_DATIVE_FORMS)}; после ${formatWhole(maxDeclines)} ${pluralize(maxDeclines, DECLINE_GENITIVE_FORMS)} заказ уходит на ручное назначение`,
} as const;

export const USERS_TEXTS = {
  KPI_NEW_CLIENTS: 'Новые клиенты',
  KPI_ACTIVE_CLIENTS: 'Активные клиенты',
  KPI_REPEAT_CLIENTS: 'Повторные клиенты',
  KPI_COURIERS_ONLINE: 'Курьеров на линии',
  ACTIVE_HINT: 'оформили хотя бы один заказ',
  CLIENTS_CHART_TITLE: 'Новые клиенты по дням',
  CLIENTS_CHART_SUBTITLE: 'Зарегистрировались за период',
  ORDERS_PER_CLIENT_TITLE: 'Заказов на клиента',
  BUCKET_ONE: '1 заказ',
  BUCKET_TWO: '2 заказа',
  BUCKET_THREE_TO_FIVE: '3–5 заказов',
  BUCKET_SIX_PLUS: '6 и больше',
  REPEAT_SUMMARY: 'Повторные клиенты (2 заказа и больше)',
  couriersNote: (avg: number | null): string =>
    avg === null
      ? 'сейчас'
      : `сейчас; в среднем ${formatDecimal(avg)} ${pluralize(Math.round(avg), DELIVERY_FORMS)}`,
  ordersPerClientSubtitle: (active: number): string =>
    `${formatWhole(active)} ${pluralize(active, CLIENT_FORMS)} оформили хотя бы один заказ`,
} as const;

export const SUPPORT_TEXTS = {
  KPI_CREATED: 'Обращений',
  KPI_FIRST_RESPONSE: 'Первый ответ',
  KPI_UNANSWERED: 'Без ответа сейчас',
  KPI_CLOSED: 'Закрыто',
  MEDIAN: 'медиана',
  ALL_ANSWERED: 'все обращения с ответом',
  TOPICS_TITLE: 'Обращения по темам',
  RESPONSE_TITLE: 'Первый ответ поддержки по дням, мин',
  RESPONSE_SUBTITLE: 'Медиана времени до первого ответа сотрудника',
  NO_DAY_ANSWER: 'нет ответа',
  longestWait: (minutes: number): string => `дольше всех ждёт ${formatDurationMinutes(minutes)}`,
  topicsSubtitle: (total: number): string =>
    `${formatWhole(total)} ${pluralize(total, TICKET_FORMS)} за период`,
} as const;
